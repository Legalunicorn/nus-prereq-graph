import type cytoscape from "cytoscape";
import type { Point, Route } from "./graphLayout";

/** Converts points to a weight along the source-target line and a perpendicular distance, as cytoscape expects. */
export function controlPointsFor(source: Point, target: Point, bends: Point[]) {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared === 0) {
        return { weights: [], distances: [] };
    }
    const length = Math.sqrt(lengthSquared);
    return {
        weights: bends.map(p => ((p.x - source.x) * dx + (p.y - source.y) * dy) / lengthSquared),
        distances: bends.map(p => ((p.y - source.y) * dx - (p.x - source.x) * dy) / length),
    };
}

const endpoint = ({ x, y }: Point) => `${x.toFixed(1)}px ${y.toFixed(1)}px`;

export function applyRoutes(cy: cytoscape.Core, routes: Map<string, Route>, positions: Record<string, Point>) {
    cy.batch(() => {
        cy.edges().forEach(edge => {
            const source = positions[edge.source().id()];
            const target = positions[edge.target().id()];
            const route = routes.get(edge.id());
            if (!source || !target || !route) {
                return;
            }
            const { weights, distances } = controlPointsFor(source, target, route.bends);
            edge.style({
                "source-endpoint": endpoint(route.sourceEnd),
                "target-endpoint": endpoint(route.targetEnd),
                ...(route.bends.length === 0
                    ? { "curve-style": "straight" }
                    : {
                        "curve-style": "unbundled-bezier",
                        "control-point-weights": weights.map(w => w.toFixed(3)).join(" "),
                        "control-point-distances": distances.map(d => d.toFixed(1)).join(" "),
                    }),
            });
        });
    });
}

export const straighten = (edges: cytoscape.EdgeCollection) => edges.style({
    "curve-style": "straight",
    "source-endpoint": "outside-to-node",
    "target-endpoint": "outside-to-node",
});
