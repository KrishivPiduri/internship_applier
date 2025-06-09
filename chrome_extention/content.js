/* Modified script to exclude inputs inside dynamic sections from the summary */

function hasOptions(input) {
    if (input.matches('select') && input.options.length > 0) return true;

    const listboxId = input.getAttribute('aria-controls');
    if (listboxId) {
        const listbox = document.getElementById(listboxId);
        if (listbox?.getAttribute('role') === 'listbox') return true;
    }

    const ancestorLB = input.closest('[role="listbox"]');
    if (ancestorLB && ancestorLB.offsetParent !== null) return true;

    const reactContainer = input.closest('.select');
    if (reactContainer) {
        const visibleOptions = reactContainer.querySelectorAll('.select__menu .select__option');
        if ([...visibleOptions].some(el => el.offsetParent !== null)) return true;
    }

    return false;
}

function init() {
    if (!document || !document.forms || !document.body) return;

    let lastHighlightedForm = null;
    const SECTION_SUFFIX = '--form';
    let seenSections = new Set();

    function findMainForm() {
        const forms = Array.from(document.forms).filter(f => f.offsetParent !== null);
        if (!forms.length) return null;

        function scoreForm(form) {
            const inputs = form.querySelectorAll('input, select, textarea');
            const numInputs = inputs.length;
            const hasSubmit = form.querySelector('button, input[type="submit"]') !== null;

            let score = numInputs * 2 + (hasSubmit ? 5 : 0);
            if (form.classList.contains('application-form') || form.id.includes('main')) score += 50;
            return score;
        }

        return forms.reduce((best, form) => {
            const score = scoreForm(form);
            return score > best.score ? { form, score } : best;
        }, { form: null, score: -1 }).form;
    }

    function getInputFields(form) {
        if (!form) return [];

        const standardInputs = Array.from(form.querySelectorAll('input, select, textarea'));
        const customSelects = Array.from(form.querySelectorAll('.select__input-container input'));
        const allInputs = { input: new Set(), groups: new Set() };

        // Scan and collect dynamic section roots first
        const dynamicSectionRoots = new Set();
        form.querySelectorAll(`[class*="${SECTION_SUFFIX}"]`).forEach(el => {
            if (
                !allInputs.groups.has(el) &&
                Array.from(el.classList).some(c => c.endsWith(SECTION_SUFFIX))
            ) {
                dynamicSectionRoots.add(el);
            }
        });
        // Utility to check if an element is inside any dynamic section
        const isInDynamicSection = el => {
            for (const section of dynamicSectionRoots) {
                if (section.contains(el)) {
                    return true;
                }
            }
            return false;
        };

        function parseInput(input) {
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

            if (!hasOptions(input)) {
                return { id: input.id, type: input.type, label, options: null };
            }

            let options = [];
            if (input.matches('select')) {
                options = Array.from(input.options).map(opt => opt.textContent.trim());
            } else {
                const listboxId = input.getAttribute('aria-controls');
                const listbox = listboxId ? document.getElementById(listboxId) : null;

                if (listbox && listbox.getAttribute('role') === 'listbox') {
                    options = Array.from(listbox.querySelectorAll('[role="option"]')).map(opt => opt.textContent.trim());
                } else {
                    const fallbackListbox = input.closest('[role="listbox"]');
                    if (fallbackListbox && fallbackListbox.offsetParent !== null) {
                        options = Array.from(fallbackListbox.querySelectorAll('[role="option"]')).map(opt => opt.textContent.trim());
                    } else {
                        const reactSelectOptions = Array.from(document.querySelectorAll('.select__menu .select__option'))
                            .filter(el => el.offsetParent !== null)
                            .map(el => el.textContent.trim());
                        if (reactSelectOptions.length) {
                            options = reactSelectOptions;
                        }
                    }
                }
            }

            return { id: input.id, type: input.type, label, options };
        }
        let groups={}
        dynamicSectionRoots.forEach(section => {
            groups[section.classList[0]] = Array.from(section.querySelectorAll('input, select, textarea')).map(parseInput);
        })
        // Filter out inputs in dynamic sections
        const visibleInputs = [...standardInputs, ...customSelects].filter(input => !isInDynamicSection(input));
        visibleInputs.forEach(input => allInputs.input.add(input));

        // Activate custom selects (if needed)
        customSelects.forEach(input => {
            if (!isInDynamicSection(input)) {
                input.focus();
                ['mousedown', 'mouseup', 'click'].forEach(evtName => {
                    const evt = new MouseEvent(evtName, { bubbles: true });
                    input.dispatchEvent(evt);
                });
            }
        });

        setTimeout(() => {
            const fieldDetails = Array.from(allInputs.input).map(parseInput);

            console.log("Form Field Summary:", {inputs: fieldDetails, groups: groups});
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

    function detectSections(root) {
        root.querySelectorAll(`[class*="${SECTION_SUFFIX}"]`).forEach(el => {
            if (!seenSections.has(el) && Array.from(el.classList).some(c => c.endsWith(SECTION_SUFFIX))) {
                seenSections.add(el);
                console.log('Detected dynamic section:', el);
            }
        });
    }

    const sectionObserver = new MutationObserver(mutations => {
        for (const m of mutations) {
            m.addedNodes.forEach(node => {
                if (node instanceof HTMLElement) detectSections(node);
            });
        }
    });

    function highlightForm(form) {
        if (lastHighlightedForm && lastHighlightedForm !== form) {
            lastHighlightedForm.classList.remove('highlighted-main-form');
            const oldAll = getInputFields(lastHighlightedForm);
            Array.from(oldAll.input).forEach(el => el.classList.remove('highlighted-input'));
            sectionObserver.disconnect();
        }

        if (form && form !== lastHighlightedForm) {
            form.classList.add('highlighted-main-form');
            const all = getInputFields(form);
            Array.from(all.input).forEach(el => el.classList.add('highlighted-input'));
            lastHighlightedForm = form;
            detectSections(form);
            sectionObserver.observe(form, { childList: true, subtree: true });
        }
    }

    let detectTimeout;
    let idleTimer;

    function debouncedDetect() {
        clearTimeout(detectTimeout);
        detectTimeout = setTimeout(() => {
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => highlightForm(findMainForm()), 800);
        }, 200);
    }

    const observer = new MutationObserver(debouncedDetect);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

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
