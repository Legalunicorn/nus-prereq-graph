import dagre from "@dagrejs/dagre";
import type { GraphLabel } from "@dagrejs/dagre";
import type cytoscape from "cytoscape";
import type { GraphDirection } from "./cytoscapeConfig";

interface Point { x: number; y: number; }
export interface LayoutNode { id: string; width: number; height: number; }
export interface LayoutEdge { id: string; source: string; target: string; }

const CORNER_RADIUS = 8;
const WRAPPED_STEM = 24;
const COLLINEAR_TOLERANCE = 1;

const SETTINGS: Record<GraphDirection, GraphLabel> = {
    horizontal: { rankdir: "LR", nodesep: 32, ranksep: 72, edgesep: 10 },
    vertical: { rankdir: "TB", nodesep: 14, ranksep: 96, edgesep: 10 },
};
// Vertical needs more, as semester tags sit under the cards.
const TURN_ROOM: Record<GraphDirection, number> = { horizontal: 8, vertical: 24 };

function distanceFromLine(point: Point, start: Point, end: Point) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    if (length === 0) {
        return Math.hypot(point.x - start.x, point.y - start.y);
    }
    return Math.abs((point.y - start.y) * dx - (point.x - start.x) * dy) / length;
}

/** Keeps only the points where a route actually turns. */
export function bendsOf(points: Point[]): Point[] {
    const kept = [points[0]];
    for (let i = 1; i < points.length - 1; i++) {
        if (distanceFromLine(points[i], kept[kept.length - 1], points[i + 1]) > COLLINEAR_TOLERANCE) {
            kept.push(points[i]);
        }
    }
    return kept.slice(1);
}

/** Dagre routes edges around nodes, so positions and routes must come from the same run. */
export function computeLayout(nodes: LayoutNode[], edges: LayoutEdge[], direction: GraphDirection) {
    const graph = new dagre.graphlib.Graph({ multigraph: true });
    graph.setGraph({ ...SETTINGS[direction] });
    graph.setDefaultEdgeLabel(() => ({}));
    for (const { id, width, height } of nodes) {
        graph.setNode(id, { width, height });
    }
    for (const { id, source, target } of edges) {
        graph.setEdge(source, target, {}, id);
    }
    dagre.layout(graph);

    const positions: Record<string, Point> = {};
    for (const { id } of nodes) {
        const { x, y } = graph.node(id);
        positions[id] = { x, y };
    }

    const isHorizontal = direction === "horizontal";
    const alongOf = (point: Point) => (isHorizontal ? point.x : point.y);
    const acrossOf = (point: Point) => (isHorizontal ? point.y : point.x);
    const pointAt = (along: number, across: number) => (isHorizontal ? { x: along, y: across } : { x: across, y: along });

    // Half the length of each rank along the direction, plus room to turn after leaving a card.
    const bands = new Map<number, number>();
    for (const { id, width, height } of nodes) {
        const key = Math.round(alongOf(positions[id]));
        bands.set(key, Math.max(bands.get(key) ?? 0, (isHorizontal ? width : height) / 2 + TURN_ROOM[direction]));
    }
    const bandAt = (along: number) => bands.get(Math.round(along)) ?? TURN_ROOM[direction];

    const routes = new Map<string, Point[]>();
    for (const { id, source, target } of edges) {
        const start = positions[source];
        const end = positions[target];
        if (alongOf(end) <= alongOf(start)) {
            routes.set(id, []);
            continue;
        }
        // Ranks are doubled inside dagre, so every second point of a long edge sits in a real rank.
        const points: Point[] = graph.edge(source, target, id).points ?? [];
        const passes = points.slice(1, -1).filter((_, i) => i % 2 === 1);
        routes.set(id, bendsOf([
            start,
            pointAt(alongOf(start) + bandAt(alongOf(start)), acrossOf(start)),
            ...passes.flatMap(pass => [
                pointAt(alongOf(pass) - bandAt(alongOf(pass)), acrossOf(pass)),
                pointAt(alongOf(pass) + bandAt(alongOf(pass)), acrossOf(pass)),
            ]),
            pointAt(alongOf(end) - bandAt(alongOf(end)), acrossOf(end)),
            end,
        ]));
    }
    return { positions, routes };
}

/** Wrapped rows no longer match dagre's routes, so edges just leave and enter their cards vertically. */
export function wrappedRoutes(edges: LayoutEdge[], positions: Record<string, Point>) {
    const room = WRAPPED_STEM;
    return new Map(edges.map(({ id, source, target }) => {
        const start = positions[source];
        const end = positions[target];
        return [id, end.y - start.y > 2 * room
            ? [{ x: start.x, y: start.y + room }, { x: end.x, y: end.y - room }]
            : []];
    }));
}

/** Converts points to the form cytoscape expects: a weight along the source-target line and a perpendicular distance. */
export function segmentsFor(source: Point, target: Point, bends: Point[]) {
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

export function applyRoutes(cy: cytoscape.Core, routes: Map<string, Point[]>, positions: Record<string, Point>) {
    cy.batch(() => {
        cy.edges().forEach(edge => {
            const source = positions[edge.source().id()];
            const target = positions[edge.target().id()];
            const bends = routes.get(edge.id()) ?? [];
            if (!source || !target || bends.length === 0) {
                edge.style("curve-style", "straight");
                return;
            }
            const { weights, distances } = segmentsFor(source, target, bends);
            edge.style({
                "curve-style": "round-segments",
                "segment-radius": CORNER_RADIUS,
                "segment-weights": weights.map(w => w.toFixed(3)).join(" "),
                "segment-distances": distances.map(d => d.toFixed(1)).join(" "),
            });
        });
    });
}

export const straighten = (edges: cytoscape.EdgeCollection) => edges.style("curve-style", "straight");
