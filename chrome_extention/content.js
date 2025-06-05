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
            console.log("Inputs: ", Array.from(form.querySelectorAll('input, select, textarea')))
            return Array.from(form.querySelectorAll('input, select, textarea'));
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

        // Debounced detection
        let timeout;
        function debouncedDetect() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const form = findMainForm();
                highlightForm(form);
            }, 500);
        }

        // Observe DOM changes
        const observer = new MutationObserver(debouncedDetect);
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true
        });

        injectStyles();
        debouncedDetect();

        // Optional global exports
        window.findMainForm = findMainForm;
        window.getInputFields = getInputFields;
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
