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

        // 1. Find all inputs/selects/textareas whose id ends with "--<number>"
        function findRepeatingById(form) {
            const idElements = Array.from(form.querySelectorAll('input[id], select[id], textarea[id]'))
                .filter(el => /--\d+$/.test(el.id));

            const groups = {};
            idElements.forEach(el => {
                const match = el.id.match(/^(.*)--(\d+)$/);
                if (!match) return;
                const idx = parseInt(match[2], 10); // numeric index
                if (!groups[idx]) groups[idx] = [];
                groups[idx].push(el);
            });

            return groups; // { 0: [el, el, ...], 1: [el, ...], ... }
        }

        // 2. Given an array of elements, find their lowest common ancestor
        function getCommonAncestor(nodes) {
            if (!nodes.length) return null;
            function ancestorChain(el) {
                const chain = [];
                let curr = el;
                while (curr) {
                    chain.unshift(curr);
                    curr = curr.parentElement;
                }
                return chain;
            }
            const chains = nodes.map(ancestorChain);
            let common = null;
            for (let i = 0; ; i++) {
                const first = chains[0][i];
                if (!first) break;
                if (chains.every(chain => chain[i] === first)) {
                    common = first;
                } else {
                    break;
                }
            }
            return common;
        }

        // 3. Watch for any new element whose id ends with "--<newIndex>"
        function watchForNewIdIndex(form, lastIndex) {
            const observer = new MutationObserver(records => {
                records.forEach(record => {
                    record.addedNodes.forEach(node => {
                        if (!(node instanceof HTMLElement)) return;

                        // Check node itself
                        const ownMatch = node.id && node.id.match(/^(.*)--(\d+)$/);
                        if (ownMatch) {
                            const idx = parseInt(ownMatch[2], 10);
                            if (idx > lastIndex) {
                                observer.disconnect();
                                const idGroups = findRepeatingById(form);
                                const container = getCommonAncestor(idGroups[idx] || []);
                                console.log(`New block “--${idx}” appeared. Container:`, container);
                            }
                        }

                        // Check descendants
                        const descendants = node.querySelectorAll('[id]');
                        descendants.forEach(el => {
                            const m = el.id.match(/^(.*)--(\d+)$/);
                            if (!m) return;
                            const idx = parseInt(m[2], 10);
                            if (idx > lastIndex) {
                                observer.disconnect();
                                const idGroups = findRepeatingById(form);
                                const container = getCommonAncestor(idGroups[idx] || []);
                                console.log(`New block “--${idx}” appeared. Container:`, container);
                            }
                        });
                    });
                });
            });

            observer.observe(form, { subtree: true, childList: true });
        }

        function getInputFields(form) {
            if (!form) return [];

            const standardInputs = Array.from(form.querySelectorAll('input, select, textarea'));
            const customSelects = Array.from(form.querySelectorAll('.select__input-container input'));
            const allInputs = [...new Set([...standardInputs, ...customSelects])];

            // Trigger dropdowns: keep comboboxes open to allow options to render
            customSelects.forEach(input => {
                const isCombo = input.getAttribute('role') === 'combobox' || input.getAttribute('aria-autocomplete') === 'list';
                input.focus();
                ['mousedown', 'mouseup', 'click'].forEach(evtName => {
                    const evt = new MouseEvent(evtName, { bubbles: true });
                    input.dispatchEvent(evt);
                });
                // collapse non-combo selects only
                if (!isCombo) input.blur();
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

                    let options = null;
                    // For native selects
                    if (input.matches('select')) {
                        options = Array.from(input.options).map(opt => opt.textContent.trim());
                    } else {
                        // For custom dropdowns using ARIA
                        const listbox = input.getAttribute('aria-controls')
                            ? document.getElementById(input.getAttribute('aria-controls'))
                            : null;
                        if (listbox?.getAttribute('role') === 'listbox') {
                            const opts = Array.from(listbox.querySelectorAll('[role="option"]'))
                                .map(opt => opt.textContent.trim());
                            if (opts.length) options = opts;
                        } else {
                            // Fallback within same container
                            const container = input.closest('div, td, th, span, p');
                            const fallbackListboxes = container
                                ? container.querySelectorAll('[role="listbox"]')
                                : [];
                            fallbackListboxes.forEach(lb => {
                                if (lb.offsetParent !== null) {
                                    const opts = Array.from(lb.querySelectorAll('[role="option"]'))
                                        .map(opt => opt.textContent.trim());
                                    if (opts.length) options = opts;
                                }
                            });
                        }
                    }

                    const isComboField = input.getAttribute('role') === 'combobox' && input.getAttribute('aria-autocomplete') === 'list';
                    const field = { element: input, label, options, lazyLoad: isComboField && options === null };
                    if (isComboField) {
                        const obs = new MutationObserver(records => {
                            records.forEach(r => {
                                if (r.attributeName === 'aria-expanded' && input.getAttribute('aria-expanded') === 'true') {
                                    const lbId = input.getAttribute('aria-controls');
                                    const lb = lbId ? document.getElementById(lbId) : null;
                                    if (lb) {
                                        const newOpts = Array.from(lb.querySelectorAll('[role="option"]'))
                                            .map(opt => opt.textContent.trim());
                                        if (newOpts.length) {
                                            field.options = newOpts;
                                            field.lazyLoad = false;
                                            console.log('Lazy-loaded options for', label, newOpts);
                                            obs.disconnect();
                                        }
                                    }
                                }
                            });
                        });
                        obs.observe(input, { attributes: true, attributeFilter: ['aria-expanded'] });
                    }
                    return field;
                });

                console.log("Form Field Summary:", fieldDetails);

                // ------------ REPEATING-GROUP DETECTION BY ID PATTERN ------------
                const idGroups = findRepeatingById(form);
                const indices = Object.keys(idGroups)
                    .map(n => parseInt(n, 10))
                    .sort((a, b) => a - b);
                const maxIndex = indices.length ? indices[indices.length - 1] : -1;

                indices.forEach(idx => {
                    const container = getCommonAncestor(idGroups[idx]);
                    console.log(`Detected block index ${idx}. Container:`, container);
                });

                // Now watch for a new index > maxIndex
                watchForNewIdIndex(form, maxIndex);
                // ----------------------------------------------------------------

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

        // Expose helpers if needed
        window.findMainForm = findMainForm;
        window.getInputFields = getInputFields;
        window.findRepeatingById = findRepeatingById;
        window.getCommonAncestor = getCommonAncestor;
        window.watchForNewIdIndex = watchForNewIdIndex;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
