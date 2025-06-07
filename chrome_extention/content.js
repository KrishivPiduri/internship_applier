(function () {
    function init() {
        if (!document || !document.forms || !document.body) return;

        function findMainForm() {
            const forms = Array.from(document.forms).filter(f => f.offsetParent !== null);
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

        function getLabelForInput(input) {
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

            return label;
        }

        function extractFields(inputs) {
            return inputs.map(input => {
                let options = [];
                if (input.matches('select')) {
                    options = Array.from(input.options).map(opt => opt.textContent.trim());
                }

                return {
                    element: input,
                    label: getLabelForInput(input),
                    options
                };
            });
        }

        function detectRepeaters(form = document) {
            const repeaters = [];
            const repeatInputs = new Set();
            const clickables = Array.from(form.querySelectorAll('button, [role=button], a'));

            clickables.forEach(btn => {
                const text = (btn.textContent || btn.getAttribute('aria-label') || '').trim();
                if (!/add/i.test(text) || text.length > 30) return;
                const parent = btn.parentElement;
                if (!parent) return;

                const siblings = Array.from(parent.children).filter(c => c !== btn && c.nodeType === 1);
                if (siblings.length < 1) return;

                const sigMap = new Map();
                siblings.forEach(node => {
                    const sig = computeSignature(node);
                    const arr = sigMap.get(sig) || []; arr.push(node); sigMap.set(sig, arr);
                });

                let templateSig = null, blocks = [];
                sigMap.forEach((nodes, sig) => {
                    if (nodes.length > blocks.length) {
                        templateSig = sig; blocks = nodes;
                    }
                });

                if (!templateSig || blocks.length < 1) return;

                blocks.forEach(n => Array.from(n.querySelectorAll('input, select, textarea')).forEach(el => repeatInputs.add(el)));

                const label = text;
                const extractedBlocks = blocks.map(block => extractFields(Array.from(block.querySelectorAll('input, select, textarea'))));

                repeaters.push({ label, blocks: extractedBlocks });
            });

            return { repeaters, repeatInputs };
        }

        function computeSignature(node) {
            const tag = node.tagName;
            const childCount = node.children.length;
            let depth = 0, cur = node;
            while (cur.firstElementChild) { depth++; cur = cur.firstElementChild; }
            return `${tag}|${childCount}|${depth}`;
        }

        function getStructuredFormInfo() {
            const form = findMainForm();
            if (!form) return;

            const { repeaters, repeatInputs } = detectRepeaters(form);

            const allInputs = Array.from(form.querySelectorAll('input, select, textarea'));
            const regularInputs = allInputs.filter(el => !repeatInputs.has(el));

            const fields = extractFields(regularInputs);

            const output = {
                fields,
                groups: repeaters.map(r => ({
                    label: r.label,
                    blocks: r.blocks.flat()
                }))
            };

            console.log(JSON.stringify(output, null, 2));
        }

        getStructuredFormInfo();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
