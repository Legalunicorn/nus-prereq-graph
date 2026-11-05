import dagre from "@dagrejs/dagre";
import type { GraphLabel } from "@dagrejs/dagre";
import type { GraphDirection } from "./cytoscapeConfig";

export interface Point { x: number; y: number; }
export interface LayoutNode { id: string; width: number; height: number; }
export interface LayoutEdge { id: string; source: string; target: string; }
/** `sourceEnd` and `targetEnd` are where the edge touches each node, relative to its centre. */
export interface Route { bends: Point[]; sourceEnd: Point; targetEnd: Point; }

type Positions = Record<string, Point>;

const COLLINEAR_TOLERANCE = 1;
const PORT_SPACING = 7;
const PORT_MARGIN = 3;
// Dagre's ordering is a heuristic, so several starting orders often beat one.
const LAYOUT_TRIES = 16;
const MAX_NODES_FOR_TRIES = 90;
const LENGTH_WEIGHT = 1e-3;

const SETTINGS: Record<GraphDirection, GraphLabel> = {
    horizontal: { rankdir: "LR", nodesep: 40, ranksep: 72, edgesep: 16 },
    vertical: { rankdir: "TB", nodesep: 24, ranksep: 88, edgesep: 16 },
};
// Vertical needs more, as semester tags sit under the cards.
const TURN_ROOM: Record<GraphDirection, number> = { horizontal: 10, vertical: 26 };

const axesFor = (direction: GraphDirection) => direction === "horizontal"
    ? {
        along: (p: Point) => p.x,
        across: (p: Point) => p.y,
        at: (along: number, across: number): Point => ({ x: along, y: across }),
        length: (node: LayoutNode) => node.width,
        side: (node: LayoutNode) => node.height,
    }
    : {
        along: (p: Point) => p.y,
        across: (p: Point) => p.x,
        at: (along: number, across: number): Point => ({ x: across, y: along }),
        length: (node: LayoutNode) => node.height,
        side: (node: LayoutNode) => node.width,
    };

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

function runDagre(nodes: LayoutNode[], edges: LayoutEdge[], direction: GraphDirection) {
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

    const positions: Positions = {};
    for (const { id } of nodes) {
        const { x, y } = graph.node(id);
        positions[id] = { x, y };
    }
    // Ranks are doubled inside dagre, so every second point of a long edge sits in a real rank.
    const passes = new Map(edges.map(({ id, source, target }) => {
        const points: Point[] = graph.edge(source, target, id).points ?? [];
        return [id, points.slice(1, -1).filter((_, i) => i % 2 === 1)];
    }));
    return { positions, passes };
}

function assignPorts(
    nodes: LayoutNode[],
    edges: LayoutEdge[],
    end: "source" | "target",
    sideOf: (node: LayoutNode) => number,
    heading: (edge: LayoutEdge) => number,
) {
    const offsets = new Map<string, number>();
    for (const node of nodes) {
        const attached = edges.filter(edge => edge[end] === node.id).sort((a, b) => heading(a) - heading(b));
        const spots = portOffsets(attached.length, sideOf(node));
        attached.forEach((edge, i) => offsets.set(edge.id, spots[i]));
    }
    return offsets;
}

function layoutOnce(nodes: LayoutNode[], edges: LayoutEdge[], direction: GraphDirection) {
    const { positions, passes } = runDagre(nodes, edges, direction);
    const axes = axesFor(direction);
    const nodeById = new Map(nodes.map(node => [node.id, node]));
    const halfLength = (id: string) => axes.length(nodeById.get(id) as LayoutNode) / 2;

    // Turning only outside a rank's widest card is what keeps edges from crossing cards.
    const bands = new Map<number, number>();
    for (const { id } of nodes) {
        const key = Math.round(axes.along(positions[id]));
        bands.set(key, Math.max(bands.get(key) ?? 0, halfLength(id) + TURN_ROOM[direction]));
    }
    const bandAt = (along: number) => bands.get(Math.round(along)) ?? TURN_ROOM[direction];

    const passesOf = (edge: LayoutEdge) => passes.get(edge.id) ?? [];
    const sourcePorts = assignPorts(nodes, edges, "source", axes.side,
        edge => axes.across(passesOf(edge)[0] ?? positions[edge.target]));
    const targetPorts = assignPorts(nodes, edges, "target", axes.side,
        edge => axes.across(passesOf(edge).at(-1) ?? positions[edge.source]));

    const routes = new Map<string, Route>();
    const lines = edges.map(edge => {
        const start = positions[edge.source];
        const end = positions[edge.target];
        const startAlong = axes.along(start);
        const endAlong = axes.along(end);
        const startAcross = axes.across(start) + (sourcePorts.get(edge.id) ?? 0);
        const endAcross = axes.across(end) + (targetPorts.get(edge.id) ?? 0);
        const from = axes.at(startAlong + halfLength(edge.source), startAcross);
        const to = axes.at(endAlong - halfLength(edge.target), endAcross);
        const line = [
            from,
            axes.at(startAlong + bandAt(startAlong), startAcross),
            ...passesOf(edge).flatMap(pass => {
                const along = axes.along(pass);
                return [axes.at(along - bandAt(along), axes.across(pass)), axes.at(along + bandAt(along), axes.across(pass))];
            }),
            axes.at(endAlong - bandAt(endAlong), endAcross),
            to,
        ];
        routes.set(edge.id, {
            bends: bendsOf(line),
            sourceEnd: { x: from.x - start.x, y: from.y - start.y },
            targetEnd: { x: to.x - end.x, y: to.y - end.y },
        });
        return line;
    });

    const score = countCrossings(lines) + LENGTH_WEIGHT * lines.reduce((sum, line) => sum + pathLength(line), 0);
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
