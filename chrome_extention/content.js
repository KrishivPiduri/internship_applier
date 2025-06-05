(function () {
    let lastHighlightedForm = null;

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

    function findMainForm() {
        const forms = Array.from(document.forms);
        if (!forms.length) return null;

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

    function highlightForm(form) {
        if (lastHighlightedForm && lastHighlightedForm !== form) {
            lastHighlightedForm.classList.remove('highlighted-main-form');
        }
        if (form && form !== lastHighlightedForm) {
            form.classList.add('highlighted-main-form');
            lastHighlightedForm = form;
            console.log("Main form highlighted:", form);
        }
    }

    function detectAndHighlight() {
        const form = findMainForm();
        highlightForm(form);
    }

    // Debounce updates
    let timeout;
    function debouncedDetect() {
        clearTimeout(timeout);
        timeout = setTimeout(detectAndHighlight, 500);
    }

    // Observe dynamic changes
    observer = new MutationObserver(debouncedDetect);
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
    });

    // Run once on load
    debouncedDetect();
})();
