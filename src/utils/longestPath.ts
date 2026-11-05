import type cytoscape from "cytoscape";

const HIGHLIGHT_CLASS = "longest";

/** Highlights chains of modules and whatever connects them on screen. Modules not on screen are skipped. */
export function applyLongestPaths(cy: cytoscape.Core, chains: string[][]) {
    cy.elements().removeClass(HIGHLIGHT_CLASS);
    for (const codes of chains) {
        const nodes = codes.map(code => cy.getElementById(code)).filter(node => node.nonempty());
        nodes.forEach((node, index) => {
            node.addClass(HIGHLIGHT_CLASS);
            const previous = nodes[index - 1];
            if (previous) {
                node.predecessors().intersection(previous.successors()).addClass(HIGHLIGHT_CLASS);
            }
        });
    }
}
