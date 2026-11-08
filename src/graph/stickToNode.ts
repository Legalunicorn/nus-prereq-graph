import type cytoscape from "cytoscape";

const GAP = 6;
const EDGE = 4;
const GRAPH_CHANGES = "viewport resize add remove layoutstop";

interface Size { w: number; h: number; }
interface NodeBox { x: number; y: number; halfHeight: number; }

/** Where an element goes above a node, or below it if there's no room. Null while the node is off screen. */
export function placeAbove(node: NodeBox, size: Size, view: Size) {
    if (node.x < 0 || node.y < 0 || node.x > view.w || node.y > view.h) {
        return null;
    }
    const above = node.y - node.halfHeight - GAP - size.h;
    return {
        x: Math.max(EDGE, Math.min(view.w - size.w - EDGE, node.x - size.w / 2)),
        y: above >= EDGE ? above : node.y + node.halfHeight + GAP,
    };
}

/** Keeps an element beside a node through panning, zooming and layout changes. */
export function stickToNode(cy: cytoscape.Core, code: string, element: HTMLElement) {
    const place = () => {
        const node = cy.getElementById(code);
        const spot = node.empty() ? null : placeAbove(
            { ...node.renderedPosition(), halfHeight: node.renderedOuterHeight() / 2 },
            { w: element.offsetWidth, h: element.offsetHeight },
            { w: cy.width(), h: cy.height() },
        );
        element.style.visibility = spot ? "visible" : "hidden";
        if (spot) {
            element.style.transform = `translate(${spot.x}px, ${spot.y}px)`;
        }
    };
    const onPosition = (event: cytoscape.EventObject) => {
        if (event.target.id() === code) {
            place();
        }
    };
    place();
    cy.on(GRAPH_CHANGES, place);
    cy.on("position", "node", onPosition);
    return () => {
        cy.off(GRAPH_CHANGES, place);
        cy.off("position", "node", onPosition);
    };
}
