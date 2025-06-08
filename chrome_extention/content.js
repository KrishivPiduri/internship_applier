(function () {
    function init() {
        if (!document || !document.forms || !document.body) return;

        let lastHighlightedForm = null;

        function findMainForm() {
            const forms = Array.from(document.forms).filter(f => f.offsetParent !== null);
            console.log(forms.length);
            if (!forms.length) return null;

            function scoreForm(form) {
                const inputs = form.querySelectorAll('input, select, textarea');
                const numInputs = inputs.length;
                const hasSubmit = form.querySelector('button, input[type="submit"]') !== null;

                let score = 0;
                score += numInputs * 2;
                score += hasSubmit ? 5 : 0;

                if (form.classList.contains('application-form') || form.id.includes('main')) {
                    score += 50;
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

            const allInputs = {input: new Set([...standardInputs, ...customSelects]), groups: new Set()}

            customSelects.forEach(input => {
                input.focus();
                ['mousedown', 'mouseup', 'click'].forEach(evtName => {
                    const evt = new MouseEvent(evtName, { bubbles: true });
                    input.dispatchEvent(evt);
                });
            });

            setTimeout(() => {
                const fieldDetails = allInputs["inputs"].map(input => {
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
                        const listboxId = input.getAttribute('aria-controls');
                        const listbox = listboxId ? document.getElementById(listboxId) : null;

                        if (listbox && listbox.getAttribute('role') === 'listbox') {
                            options = Array.from(listbox.querySelectorAll('[role="option"]'))
                                .map(opt => opt.textContent.trim());
                        } else {
                            const fallbackListbox = input.closest('[role="listbox"]');
                            if (fallbackListbox && fallbackListbox.offsetParent !== null) {
                                options = Array.from(fallbackListbox.querySelectorAll('[role="option"]'))
                                    .map(opt => opt.textContent.trim());
                            }
                        }
                    }

                    return { id: input.id, type: input.type, label, options };
                });
                customSelects.forEach(input => {
                    input.focus();
                    ['mousedown', 'mouseup', 'click'].forEach(evtName => {
                        const evt = new MouseEvent(evtName, { bubbles: true });
                        input.dispatchEvent(evt);
                    });
                });
                console.log("Form Field Summary:", fieldDetails);
            }, 500);
            return allInputs;
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

        const SECTION_SUFFIX = '--form';
        const seenSections = new WeakSet();
        const sectionObserver = new MutationObserver(mutations => {
            for (const m of mutations) {
                m.addedNodes.forEach(node => {
                    if (!(node instanceof HTMLElement)) return;
                    detectSections(node);
                });
            }
        });

        function detectSections(root) {
            root.querySelectorAll(`[class*="${SECTION_SUFFIX}"]`).forEach(el => {
                if (
                    !seenSections.has(el) &&
                    Array.from(el.classList).some(c => c.endsWith(SECTION_SUFFIX))
                ) {
                    seenSections.add(el);
                    console.log('Detected dynamic section:', el);
                }
            });
        }
        // ─────────────────────────────────────────────────────────────

        function highlightForm(form) {
            if (lastHighlightedForm && lastHighlightedForm !== form) {
                lastHighlightedForm.classList.remove('highlighted-main-form');
                const oldInputs = getInputFields(lastHighlightedForm);
                oldInputs.forEach(el => el.classList.remove('highlighted-input'));

                sectionObserver.disconnect();
            }

            if (form && form !== lastHighlightedForm) {
                form.classList.add('highlighted-main-form');
                const inputs = getInputFields(form);
                inputs.forEach(el => el.classList.add('highlighted-input'));
                lastHighlightedForm = form;

                detectSections(form);
                sectionObserver.observe(form, {
                    childList: true,
                    subtree: true
                });
            }
        }

        let detectTimeout;
        let idleTimer;

        function debouncedDetect() {
            clearTimeout(detectTimeout);
            detectTimeout = setTimeout(() => {
                clearTimeout(idleTimer);
                idleTimer = setTimeout(() => {
                    const form = findMainForm();
                    highlightForm(form);
                }, 800);
            }, 200);
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
