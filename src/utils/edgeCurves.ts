import type cytoscape from "cytoscape";
import type { GraphDirection } from "./cytoscapeConfig";

interface Point { x: number; y: number; }

const DIRECTION_KEY = "direction";

export const getDirection = (cy: cytoscape.Core): GraphDirection | undefined => cy.scratch(DIRECTION_KEY);
export const setDirection = (cy: cytoscape.Core, direction: GraphDirection) => cy.scratch(DIRECTION_KEY, direction);

/**
 * Returns an S-curve leaving along the graph's direction and arriving the same way, in the form
 * cytoscape expects: each control point as a weight along the source-target line and a
 * perpendicular distance from it.
 */
export function curveFor(source: Point, target: Point, direction: GraphDirection) {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared === 0) {
        return { weights: [0.5, 0.5], distances: [0, 0] };
    }

    const controls = direction === "horizontal"
        ? [{ x: source.x + dx / 2, y: source.y }, { x: source.x + dx / 2, y: target.y }]
        : [{ x: source.x, y: source.y + dy / 2 }, { x: target.x, y: source.y + dy / 2 }];

    const length = Math.sqrt(lengthSquared);
    return {
        weights: controls.map(c => ((c.x - source.x) * dx + (c.y - source.y) * dy) / lengthSquared),
        distances: controls.map(c => ((c.y - source.y) * dx - (c.x - source.x) * dy) / length),
    };
}

export function applyEdgeCurves(cy: cytoscape.Core, edges: cytoscape.EdgeCollection) {
    const direction = getDirection(cy) ?? "horizontal";
    cy.batch(() => {
        edges.forEach(edge => {
            const { weights, distances } = curveFor(edge.source().position(), edge.target().position(), direction);
            edge.style({
                "control-point-weights": weights.map(w => w.toFixed(3)).join(" "),
                "control-point-distances": distances.map(d => d.toFixed(1)).join(" "),
            });
        });
    });
}
