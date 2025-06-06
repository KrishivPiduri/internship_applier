(() => {
    // 1. Find the main <form> on the page
    const form = (() => {
        const allForms = Array.from(document.forms).filter(el => el.offsetParent !== null);
        if (!allForms.length) return null;
        // Simple heuristic: pick the form with most input/select/textarea children
        return allForms.reduce((best, f) => {
            const score = f.querySelectorAll('input, select, textarea').length;
            return score > best.score ? { form: f, score } : best;
        }, { form: null, score: -1 }).form;
    })();
    if (!form) return;

    // 2. Utility: find all elements whose id ends in "--<number>"
    function findRepeatingById(form) {
        const idElems = Array.from(form.querySelectorAll('input[id], select[id], textarea[id]'))
            .filter(el => /--\d+$/.test(el.id));
        // Group by numeric suffix
        const groups = {};
        idElems.forEach(el => {
            const [, , idxStr] = el.id.match(/^(.*)--(\d+)$/) || [];
            if (!idxStr) return;
            const idx = parseInt(idxStr, 10);
            if (!groups[idx]) groups[idx] = [];
            groups[idx].push(el);
        });
        return groups; // e.g. { 0: [<school--0>, <degree--0>, …], 1: [<school--1>, …], … }
    }

    // 3. Utility: get lowest-common-ancestor for a list of elements
    function getCommonAncestor(nodes) {
        if (!nodes.length) return null;
        function chain(el) {
            const c = [];
            let cur = el;
            while (cur) {
                c.unshift(cur);
                cur = cur.parentElement;
            }
            return c;
        }
        const chains = nodes.map(chain);
        let common = null;
        for (let i = 0;; i++) {
            const first = chains[0][i];
            if (!first) break;
            if (chains.every(ch => ch[i] === first)) {
                common = first;
            } else {
                break;
            }
        }
        return common;
    }

    // 4. Build groups: { index → { container, inputs } }
    const idGroups = findRepeatingById(form);
    const sortedIndices = Object.keys(idGroups).map(n => parseInt(n, 10)).sort((a, b) => a - b);
    // We'll infer groupName from the container’s classList – specifically "education--form"
    let groupName = null;
    if (sortedIndices.length) {
        const sampleContainer = getCommonAncestor(idGroups[sortedIndices[0]]);
        if (sampleContainer && sampleContainer.className.includes("education--form")) {
            groupName = "education";
        } else {
            groupName = "block";
        }
    }

    const groups = {};
    sortedIndices.forEach(idx => {
        const elems = idGroups[idx];
        const container = getCommonAncestor(elems);
        groups[idx] = { container, inputs: elems };
    });

    // 5. Pick a distinct highlight color for each index (cycles through palette)
    const palette = ["#ff6b6b", "#6bc1ff", "#6bff8c", "#d96bff", "#ffc36b"];
    function getColor(idx) {
        return palette[idx % palette.length];
    }

    // 6. Highlight each container once, and then outline each child input
    Object.entries(groups).forEach(([idxStr, { container, inputs }]) => {
        const idx = parseInt(idxStr, 10);
        if (!container) return;
        const color = getColor(idx);

        // Outline container
        container.style.outline = `3px dashed ${color}`;
        container.style.position = container.style.position || "relative";

        // Label the container at its top
        const tag = document.createElement("div");
        tag.textContent = `${groupName} [${idx}]`;
        tag.style.position = "absolute";
        tag.style.top = "-1.2em";
        tag.style.left = "0";
        tag.style.background = color;
        tag.style.color = "#fff";
        tag.style.fontSize = "12px";
        tag.style.fontWeight = "bold";
        tag.style.padding = "2px 4px";
        tag.style.borderRadius = "4px";
        tag.style.zIndex = "9999";
        container.appendChild(tag);

        // Outline each child input/select/textarea
        inputs.forEach(el => {
            el.style.outline = `2px solid ${color}`;
            el.style.position = el.style.position || "relative";
            // Small badge on each field
            const badge = document.createElement("div");
            badge.textContent = `${groupName}[${idx}]: ${el.id}`;
            badge.style.position = "absolute";
            badge.style.top = "-1.2em";
            badge.style.left = "0";
            badge.style.background = color;
            badge.style.color = "#fff";
            badge.style.fontSize = "9px";
            badge.style.padding = "1px 3px";
            badge.style.borderRadius = "3px";
            badge.style.zIndex = "9999";
            badge.style.pointerEvents = "none";
            el.parentElement?.appendChild(badge);
        });
    });

    // 7. Build the final "fields" array with metadata
    const allFields = Array.from(form.querySelectorAll("input, select, textarea")).map(el => {
        const tag = el.tagName.toLowerCase();
        const type = el.type || null;
        const role = el.getAttribute("role") || null;
        const autocomplete = el.getAttribute("autocomplete") || null;
        const id = el.id || null;
        const name = el.name || null;

        // Find the label text (same getLabel logic as before)
        let labelTxt = "";
        if (id) {
            const lbl = document.querySelector(`label[for="${id}"]`);
            if (lbl) labelTxt = lbl.innerText.trim();
        }
        if (!labelTxt) {
            const parentLabel = el.closest("label, [aria-label]");
            if (parentLabel) labelTxt = parentLabel.innerText.trim();
        }

        // Determine group/index by matching --(\d+)$
        let grp = null, idx = null, containerSel = null;
        const m = id && id.match(/--(\d+)$/);
        if (m) {
            idx = parseInt(m[1], 10);
            grp = groupName;
            const c = groups[idx]?.container;
            if (c) {
                // Create a simple selector for the container, e.g. "div.education--form:nth-of-type(1)"
                const allSiblings = Array.from(c.parentElement.querySelectorAll(`.${c.classList[0]}`));
                const position = allSiblings.indexOf(c) + 1;
                containerSel = `.${c.classList[0]}:nth-of-type(${position})`;
            }
        }

        // Gather options if it's a native <select>
        let options = null;
        if (tag === "select") {
            options = Array.from(el.options).map(o => o.textContent.trim());
        }

        return {
            id,
            name,
            label: labelTxt,
            tag,
            type,
            role,
            autocomplete,
            group: grp,
            index: idx,
            containerSelector: containerSel,
            options
        };
    });

    // 8. Expose the final structure and log it
    window.__formAutofillStructure = {
        fields: allFields,
        groups: Object.keys(groups).reduce((acc, idxStr) => {
            const i = parseInt(idxStr, 10);
            const c = groups[i].container;
            // Reconstruct same containerSelector
            let sel = null;
            if (c) {
                const cls = c.classList[0];
                const allSame = Array.from(c.parentElement.querySelectorAll(`.${cls}`));
                sel = `.${cls}:nth-of-type(${allSame.indexOf(c) + 1})`;
            }
            acc[i] = { containerSelector: sel, inputIds: idGroups[i].map(el => el.id) };
            return acc;
        }, {})
    };

    console.log("Form structure with groups:", window.__formAutofillStructure);
})();
