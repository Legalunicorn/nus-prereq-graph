import type cytoscape from "cytoscape";
import { includeTags } from "./semesterTags";

const CHAIN_TARGETS = 'node[kind="module"], node[kind="gate"]';

/** Dims everything outside a node's chain on hover, or until cleared on tap, which also suits touch screens. */
export function attachChainHighlight(cy: cytoscape.Core) {
    let pinned: cytoscape.NodeSingular | null = null;

    const clear = () => cy.elements().removeClass("dimmed");
    const highlight = (node: cytoscape.NodeSingular) => {
        clear();
        const chain = node.predecessors().union(node.successors()).union(node);
        cy.elements().not(includeTags(cy, chain)).addClass("dimmed");
    };
    const unpin = () => {
        pinned = null;
        clear();
    };

    const endPreview = () => {
        if (pinned) {
            highlight(pinned);
        } else {
            clear();
        }
    };

    cy.on("mouseover", CHAIN_TARGETS, evt => highlight(evt.target));
    cy.on("mouseout", CHAIN_TARGETS, endPreview);
    cy.on("tap", CHAIN_TARGETS, evt => {
        if (pinned === evt.target) {
            unpin();
        } else {
            pinned = evt.target;
            highlight(evt.target);
        }
    });
    cy.on("tap", evt => {
        if (evt.target === cy) {
            unpin();
        }
    });
    cy.on("layoutstop", () => {
        if (pinned?.inside()) {
            highlight(pinned);
        } else {
            unpin();
        }
    });

    /** Highlights a module from outside the graph, such as a hovered sidebar row. */
    return (code: string | null) => {
        const node = code ? cy.getElementById(code) : cy.collection();
        if (node.empty()) {
            endPreview();
        } else {
            highlight(node[0] as cytoscape.NodeSingular);
        }
    };
}
