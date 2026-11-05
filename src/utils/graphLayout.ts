import dagre from "@dagrejs/dagre";
import type { GraphLabel } from "@dagrejs/dagre";
import type cytoscape from "cytoscape";
import type { GraphDirection } from "./cytoscapeConfig";

interface Point { x: number; y: number; }
export interface LayoutNode { id: string; width: number; height: number; }
export interface LayoutEdge { id: string; source: string; target: string; }
/** `sourceEnd` and `targetEnd` are where the edge touches each node, relative to its centre. */
export interface Route { bends: Point[]; sourceEnd: Point; targetEnd: Point; }

const CORNER_RADIUS = 8;
const COLLINEAR_TOLERANCE = 1;
const PORT_SPACING = 7;
const PORT_MARGIN = 3;
// Dagre's ordering is a heuristic, so several starting orders often beat one. Larger graphs get one for speed.
const LAYOUT_TRIES = 16;
const MAX_NODES_FOR_TRIES = 90;
const TIE_BREAK_WEIGHT = 1e-4;

const SETTINGS: Record<GraphDirection, GraphLabel> = {
    horizontal: { rankdir: "LR", nodesep: 48, ranksep: 110, edgesep: 18 },
    vertical: { rankdir: "TB", nodesep: 28, ranksep: 120, edgesep: 18 },
};
// Vertical needs more, as semester tags sit under the cards.
const TURN_ROOM: Record<GraphDirection, number> = { horizontal: 10, vertical: 26 };

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

/** Offsets spread evenly around 0, closer together if they wouldn't otherwise fit along the side. */
export function portOffsets(count: number, sideLength: number): number[] {
    if (count <= 1) {
        return [0];
    }
    const spacing = Math.min(PORT_SPACING, (sideLength - 2 * PORT_MARGIN) / (count - 1));
    return Array.from({ length: count }, (_, i) => (i - (count - 1) / 2) * spacing);
}

const crosses = (a: Point, b: Point, c: Point, d: Point) => {
    const side = (p: Point, q: Point, r: Point) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
    return side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0;
};

export function countCrossings(lines: Point[][]): number {
    let total = 0;
    for (let i = 0; i < lines.length; i++) {
        for (let j = i + 1; j < lines.length; j++) {
            for (let u = 0; u + 1 < lines[i].length; u++) {
                for (let v = 0; v + 1 < lines[j].length; v++) {
                    if (crosses(lines[i][u], lines[i][u + 1], lines[j][v], lines[j][v + 1])) {
                        total++;
                    }
                }
            }
        }
    }
    return total;
}

const pathLength = (line: Point[]) =>
    line.slice(1).reduce((sum, point, i) => sum + Math.hypot(point.x - line[i].x, point.y - line[i].y), 0);

function shuffled<T>(items: T[], seed: number): T[] {
    const result = [...items];
    let state = seed;
    for (let i = result.length - 1; i > 0; i--) {
        state = (state * 1664525 + 1013904223) % 4294967296;
        const j = state % (i + 1);
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function layoutOnce(nodes: LayoutNode[], edges: LayoutEdge[], direction: GraphDirection) {
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
    const sizes = new Map(nodes.map(node => [node.id, node]));
    const alongHalf = (id: string) => (isHorizontal ? (sizes.get(id)?.width ?? 0) : (sizes.get(id)?.height ?? 0)) / 2;
    const sideLength = (id: string) => (isHorizontal ? (sizes.get(id)?.height ?? 0) : (sizes.get(id)?.width ?? 0));

    // Half the length of each rank along the direction, plus room to turn after leaving a card.
    const bands = new Map<number, number>();
    for (const { id } of nodes) {
        const key = Math.round(alongOf(positions[id]));
        bands.set(key, Math.max(bands.get(key) ?? 0, alongHalf(id) + TURN_ROOM[direction]));
    }
    const bandAt = (along: number) => bands.get(Math.round(along)) ?? TURN_ROOM[direction];

    // Ranks are doubled inside dagre, so every second point of a long edge sits in a real rank.
    const passesOf = new Map(edges.map(({ id, source, target }) => {
        const points: Point[] = graph.edge(source, target, id).points ?? [];
        return [id, points.slice(1, -1).filter((_, i) => i % 2 === 1)];
    }));

    // Each edge gets its own spot on the node, ordered by where it's heading so that fans don't cross.
    const assignPorts = (key: "source" | "target", neighbourAcross: (edge: LayoutEdge) => number) => {
        const offsets = new Map<string, number>();
        for (const { id } of nodes) {
            const attached = edges.filter(edge => edge[key] === id)
                .sort((a, b) => neighbourAcross(a) - neighbourAcross(b));
            const spots = portOffsets(attached.length, sideLength(id));
            attached.forEach((edge, i) => offsets.set(edge.id, spots[i]));
        }
        return offsets;
    };
    const sourcePorts = assignPorts("source", edge => {
        const [first] = passesOf.get(edge.id) ?? [];
        return acrossOf(first ?? positions[edge.target]);
    });
    const targetPorts = assignPorts("target", edge => {
        const passes = passesOf.get(edge.id) ?? [];
        return acrossOf(passes[passes.length - 1] ?? positions[edge.source]);
    });

    const routes = new Map<string, Route>();
    const lines: Point[][] = [];
    for (const edge of edges) {
        const { id, source, target } = edge;
        const start = positions[source];
        const end = positions[target];
        const startAcross = acrossOf(start) + (sourcePorts.get(id) ?? 0);
        const endAcross = acrossOf(end) + (targetPorts.get(id) ?? 0);
        const from = pointAt(alongOf(start) + alongHalf(source), startAcross);
        const to = pointAt(alongOf(end) - alongHalf(target), endAcross);
        const route = [
            from,
            pointAt(alongOf(start) + bandAt(alongOf(start)), startAcross),
            ...(passesOf.get(id) ?? []).flatMap(pass => [
                pointAt(alongOf(pass) - bandAt(alongOf(pass)), acrossOf(pass)),
                pointAt(alongOf(pass) + bandAt(alongOf(pass)), acrossOf(pass)),
            ]),
            pointAt(alongOf(end) - bandAt(alongOf(end)), endAcross),
            to,
        ];
        lines.push(route);
        routes.set(id, {
            bends: bendsOf(route),
            sourceEnd: { x: from.x - start.x, y: from.y - start.y },
            targetEnd: { x: to.x - end.x, y: to.y - end.y },
        });
    }

    const score = countCrossings(lines) + TIE_BREAK_WEIGHT * lines.reduce((sum, line) => sum + pathLength(line), 0);
    return { positions, routes, score };
}

/** Positions and routes come from the same run, keeping the try with the fewest crossings. */
export function computeLayout(nodes: LayoutNode[], edges: LayoutEdge[], direction: GraphDirection) {
    let best = layoutOnce(nodes, edges, direction);
    if (nodes.length > MAX_NODES_FOR_TRIES) {
        return best;
    }
    for (let seed = 1; seed < LAYOUT_TRIES; seed++) {
        const attempt = layoutOnce(shuffled(nodes, seed), shuffled(edges, seed + LAYOUT_TRIES), direction);
        if (attempt.score < best.score) {
            best = attempt;
        }
    }
    return best;
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
            const { weights, distances } = segmentsFor(source, target, route.bends);
            edge.style({
                "source-endpoint": endpoint(route.sourceEnd),
                "target-endpoint": endpoint(route.targetEnd),
                ...(route.bends.length === 0
                    ? { "curve-style": "straight" }
                    : {
                        "curve-style": "round-segments",
                        "segment-radius": CORNER_RADIUS,
                        "segment-weights": weights.map(w => w.toFixed(3)).join(" "),
                        "segment-distances": distances.map(d => d.toFixed(1)).join(" "),
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
