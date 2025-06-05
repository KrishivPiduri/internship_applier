(function () {
    function init() {
        if (!document || !document.forms || !document.body) return;

        let lastHighlightedForm = null;

        function isVisible(el) {
            return el.offsetParent !== null;
        }

        function findMainForm() {
            const forms = Array.from(document.forms).filter(isVisible);
            if (!forms.length) return null;

            function scoreForm(form) {
                const inputs = form.querySelectorAll('input, select, textarea');
                const numInputs = inputs.length;
                const hasSubmit = form.querySelector('button, input[type="submit"]') !== null;

                let score = 0;
                score += numInputs * 2;
                score += hasSubmit ? 5 : 0;

                // Bonus for form id or class names that suggest importance
                const hints = ['main', 'application', 'apply'];
                const idClass = (form.id + ' ' + form.className).toLowerCase();
                if (hints.some(h => idClass.includes(h))) {
                    score += 10;
                }

                return score;
            }

            let bestForm = null;
            let bestScore = -1;

            for (const form of forms) {
                const score = scoreForm(form);
                if (score > bestScore) {
                    bestScore = score;
                    bestForm = form;
                }
            }

            return bestForm;
        }

        function getInputFields(form) {
            if (!form) return [];

            const standardInputs = Array.from(form.querySelectorAll('input, select, textarea'));
            const customSelects = Array.from(form.querySelectorAll('.select__input-container input'));
            const allInputs = [...new Set([...standardInputs, ...customSelects])];

            // Expand and collapse custom selects to trigger rendering
            customSelects.forEach(input => {
                input.focus();
                ['mousedown', 'mouseup', 'click'].forEach(evtName => {
                    const evt = new MouseEvent(evtName, { bubbles: true });
                    input.dispatchEvent(evt);
                });
                // collapse again
                input.blur();
            });

            setTimeout(() => {
                const fieldDetails = allInputs.map(input => {
                    let label = '';

                    if (input.id) {
                        const lbl = document.querySelector(`label[for='${input.id}']`);
                        if (lbl) label = lbl.textContent.trim();
                    }

                    if (!label && input.hasAttribute('aria-labelledby')) {
                        const ids = input.getAttribute('aria-labelledby').split(/\s+/);
                        label = ids.map(id => {
                            const el = document.getElementById(id);
                            return el ? el.textContent.trim() : '';
                        }).filter(Boolean).join(' ');
                    }

                    if (!label && input.hasAttribute('aria-label')) {
                        label = input.getAttribute('aria-label').trim();
                    }

                    if (!label) {
                        const container = input.closest('div, td, th, span, p');
                        if (container) {
                            const maybeLabel = Array.from(container.childNodes).find(node => node.nodeType === 3);
                            if (maybeLabel) label = maybeLabel.textContent.trim();
                        }
                    }

                    let options = [];
                    if (input.matches('select')) {
                        options = Array.from(input.options).map(opt => opt.textContent.trim());
                    } else {
                        const listbox = input.getAttribute('aria-controls')
                            ? document.getElementById(input.getAttribute('aria-controls'))
                            : null;

                        if (listbox && listbox.getAttribute('role') === 'listbox') {
                            options = Array.from(listbox.querySelectorAll('[role="option"]'))
                                .map(opt => opt.textContent.trim());
                        } else {
                            const fallbackListboxes = document.querySelectorAll('[role="listbox"]');
                            fallbackListboxes.forEach(lb => {
                                if (lb.offsetParent !== null) {
                                    options = Array.from(lb.querySelectorAll('[role="option"]'))
                                        .map(opt => opt.textContent.trim());
                                }
                            });
                        }
                    }

                    return { element: input, label, options };
                });

                console.log("Form Field Summary:", fieldDetails);
            }, 500);

            return allInputs;
        }

        function highlightForm(form) {
            if (lastHighlightedForm && lastHighlightedForm !== form) {
                lastHighlightedForm.classList.remove('highlighted-main-form');
                const oldInputs = getInputFields(lastHighlightedForm);
                oldInputs.forEach(el => el.classList.remove('highlighted-input'));
            }

            if (form && form !== lastHighlightedForm) {
                form.classList.add('highlighted-main-form');
                const inputs = getInputFields(form);
                inputs.forEach(el => el.classList.add('highlighted-input'));
                lastHighlightedForm = form;
            }
        }

        function injectStyles() {
            const style = document.createElement('style');
            style.textContent = `
                .highlighted-main-form {
                    outline: 3px solid red !important;
                }
                .highlighted-input {
                    outline: 2px dashed orange !important;
                }
            `;
            document.head.appendChild(style);
        }

        let timeout;
        function debouncedDetect() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const form = findMainForm();
                setTimeout(() => {
                    highlightForm(form);
                }, 200);
            }, 500);
        }

        const observer = new MutationObserver(debouncedDetect);
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true
        });

        injectStyles();
        debouncedDetect();

        window.findMainForm = findMainForm;
        window.getInputFields = getInputFields;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
