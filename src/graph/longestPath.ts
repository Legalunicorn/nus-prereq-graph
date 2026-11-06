import type cytoscape from "cytoscape";
import { includeTags } from "./semesterTags";

const HIGHLIGHT_CLASS = "longest";
const FADED_CLASS = "off-path";
const FLOW_FRAME_KEY = "flowFrame";
const FLOW_INTERVAL_MS = 66;
const FLOW_SPEED = 0.03;

function stopFlow(cy: cytoscape.Core) {
    cancelAnimationFrame(cy.scratch(FLOW_FRAME_KEY));
    cy.edges().removeStyle("line-dash-offset");
}

function startFlow(cy: cytoscape.Core) {
    const edges = cy.edges(`.${HIGHLIGHT_CLASS}`);
    let last = 0;
    const tick = (now: number) => {
        if (cy.destroyed()) {
            return;
        }
        if (now - last >= FLOW_INTERVAL_MS) {
            last = now;
            edges.style("line-dash-offset", -now * FLOW_SPEED);
        }
        cy.scratch(FLOW_FRAME_KEY, requestAnimationFrame(tick));
    };
    cy.scratch(FLOW_FRAME_KEY, requestAnimationFrame(tick));
}

/** Highlights chains of modules and whatever connects them on screen. Modules not on screen are skipped. */
export function applyLongestPaths(cy: cytoscape.Core, chains: string[][]) {
    stopFlow(cy);
    cy.elements().removeClass(`${HIGHLIGHT_CLASS} ${FADED_CLASS}`);
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
    if (chains.length === 0) {
        return;
    }
    cy.elements().not(includeTags(cy, cy.elements(`.${HIGHLIGHT_CLASS}`))).addClass(FADED_CLASS);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        startFlow(cy);
    }
}
