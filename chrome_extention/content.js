(function () {
    function init() {
        if (!document || !document.forms || !document.body) return;

        let lastHighlightedForm = null;

        function findMainForm() {
            const forms = Array.from(document.forms);
            if (!forms.length) return null;

            function scoreForm(form) {
                const inputs = form.querySelectorAll('input, select, textarea');
                const numInputs = inputs.length;
                const hasPassword = form.querySelector('input[type="password"]') !== null;
                const hasSubmit = form.querySelector('button, input[type="submit"]') !== null;
                const rect = form.getBoundingClientRect();
                const area = rect.width * rect.height;

                let score = 0;
                score += numInputs * 2;
                score += hasPassword ? 10 : 0;
                score += hasSubmit ? 5 : 0;
                score += area > 0 ? Math.log(area) : 0;

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

            // 1) Grab all “native” inputs/selects/textareas:
            const standardInputs = Array.from(
                form.querySelectorAll('input, select, textarea')
            );

            // 2) Grab any custom “react-select”‐style inputs:
            const customSelects = Array.from(
                form.querySelectorAll('.select__input-container input')
            );

            // If there are no custom selects, we’ll still log the total:
            console.log("Detected inputs (native + custom):",
                standardInputs.length + customSelects.length);

            // 3) For each custom select, simulate a click (mousedown→mouseup→click)
            //    so that React/your UI library actually renders the dropdown:
            customSelects.forEach(input => {
                // First, focus so the component knows it’s active:
                input.focus();

                // Dispatch mousedown -> mouseup -> click in sequence:
                ['mousedown', 'mouseup', 'click'].forEach(evtName => {
                    const evt = new MouseEvent(evtName, { bubbles: true });
                    input.dispatchEvent(evt);
                });
            });

            // 4) Wait a bit longer (200ms) for React to mount the listbox,
            //    then query all open `[role="listbox"] [role="option"]`:
            setTimeout(() => {
                const listboxes = document.querySelectorAll('[role="listbox"]');
                listboxes.forEach(listbox => {
                    const options = Array.from(listbox.querySelectorAll('[role="option"]'));
                    if (options.length > 0) {
                        console.log(
                            "Custom select options:",
                            options.map(opt => opt.textContent.trim())
                        );
                    }
                });

                // 5) After logging, close any open dropdown by sending Escape:
                const escEvent = new KeyboardEvent('keydown', {
                    key: 'Escape',
                    bubbles: true,
                });
                customSelects.forEach(input => input.dispatchEvent(escEvent));
            }, 200);

            // Return a unified list of "input‐like" elements to highlight:
            return [...new Set([...standardInputs, ...customSelects])];
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
                console.log("Highlighted form in frame:", window.location.href, form);
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
                highlightForm(form);
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

        // Expose these if you need them elsewhere
        window.findMainForm = findMainForm;
        window.getInputFields = getInputFields;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
