import dagre from "@dagrejs/dagre";
import type { GraphLabel } from "@dagrejs/dagre";
import type { GraphDirection } from "./cytoscapeConfig";

export interface Point { x: number; y: number; }
export interface LayoutNode { id: string; width: number; height: number; }
export interface LayoutEdge { id: string; source: string; target: string; }
/** `sourceEnd` and `targetEnd` are where the edge touches each node, relative to its centre. */
export interface Route { bends: Point[]; sourceEnd: Point; targetEnd: Point; }
export interface LayoutResult { positions: Record<string, Point>; routes: Map<string, Route>; }

type Positions = Record<string, Point>;

const COLLINEAR_TOLERANCE = 1;
const PORT_SPACING = 7;
const PORT_MARGIN = 3;
// Dagre's ordering is a heuristic, so several starting orders often beat one.
const LAYOUT_TRIES = 16;
const MAX_NODES_FOR_TRIES = 90;
const TRIES_BUDGET_MS = 600;
const LENGTH_WEIGHT = 1e-3;

const MIN_GAP = 14;
const MAX_GAP = 90;
const GAP_PER_DRIFT = 0.22;

const SETTINGS: Record<GraphDirection, GraphLabel> = {
    horizontal: { rankdir: "LR", nodesep: 36, edgesep: 14 },
    vertical: { rankdir: "TB", nodesep: 22, edgesep: 14 },
};
// Vertical edges leave below the semester tags under the cards.
const TURN_ROOM: Record<GraphDirection, { exit: number; entry: number }> = {
    horizontal: { exit: 6, entry: 6 },
    vertical: { exit: 24, entry: 6 },
};

/** A gap between ranks only needs room for how far its edges travel sideways. */
export const gapFor = (drift: number) => Math.min(MAX_GAP, Math.max(MIN_GAP, drift * GAP_PER_DRIFT));

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
    const { positions: placed, passes } = runDagre(nodes, edges, direction);
    const axes = axesFor(direction);
    const room = TURN_ROOM[direction];
    const nodeById = new Map(nodes.map(node => [node.id, node]));
    const halfLength = (id: string) => axes.length(nodeById.get(id) as LayoutNode) / 2;
    const passesOf = (edge: LayoutEdge) => passes.get(edge.id) ?? [];

    const rankValues = [...nodes.map(({ id }) => placed[id]), ...[...passes.values()].flat()]
        .map(point => Math.round(axes.along(point)));
    const ranks = [...new Set(rankValues)].sort((a, b) => a - b);
    const rankIndex = new Map(ranks.map((rank, index) => [rank, index]));
    const rankOf = (point: Point) => rankIndex.get(Math.round(axes.along(point))) ?? 0;

    const halves = ranks.map(() => 0);
    for (const { id } of nodes) {
        halves[rankOf(placed[id])] = Math.max(halves[rankOf(placed[id])], halfLength(id));
    }

    const sourcePorts = assignPorts(nodes, edges, "source", axes.side,
        edge => axes.across(passesOf(edge)[0] ?? placed[edge.target]));
    const targetPorts = assignPorts(nodes, edges, "target", axes.side,
        edge => axes.across(passesOf(edge).at(-1) ?? placed[edge.source]));

    const startAcross = (edge: LayoutEdge) => axes.across(placed[edge.source]) + (sourcePorts.get(edge.id) ?? 0);
    const endAcross = (edge: LayoutEdge) => axes.across(placed[edge.target]) + (targetPorts.get(edge.id) ?? 0);

    const drifts = ranks.map(() => 0);
    for (const edge of edges) {
        const stops = [
            { rank: rankOf(placed[edge.source]), across: startAcross(edge) },
            ...passesOf(edge).map(pass => ({ rank: rankOf(pass), across: axes.across(pass) })),
            { rank: rankOf(placed[edge.target]), across: endAcross(edge) },
        ];
        stops.slice(1).forEach((stop, i) => {
            const previous = stops[i];
            const drift = Math.abs(stop.across - previous.across) / Math.max(1, stop.rank - previous.rank);
            for (let rank = previous.rank; rank < stop.rank; rank++) {
                drifts[rank] = Math.max(drifts[rank], drift);
            }
        });
    }

    const centres = [0];
    for (let rank = 1; rank < ranks.length; rank++) {
        centres[rank] = centres[rank - 1] + halves[rank - 1] + room.exit + gapFor(drifts[rank - 1]) + room.entry + halves[rank];
    }

    const positions: Positions = {};
    for (const { id } of nodes) {
        positions[id] = axes.at(centres[rankOf(placed[id])], axes.across(placed[id]));
    }

    const routes = new Map<string, Route>();
    const lines = edges.map(edge => {
        const start = positions[edge.source];
        const end = positions[edge.target];
        const startRank = rankOf(placed[edge.source]);
        const endRank = rankOf(placed[edge.target]);
        const from = axes.at(centres[startRank] + halfLength(edge.source), startAcross(edge));
        const to = axes.at(centres[endRank] - halfLength(edge.target), endAcross(edge));
        const line = [
            from,
            axes.at(centres[startRank] + halves[startRank] + room.exit, startAcross(edge)),
            ...passesOf(edge).flatMap(pass => {
                const rank = rankOf(pass);
                return [
                    axes.at(centres[rank] - halves[rank] - room.entry, axes.across(pass)),
                    axes.at(centres[rank] + halves[rank] + room.exit, axes.across(pass)),
                ];
            }),
            axes.at(centres[endRank] - halves[endRank] - room.entry, endAcross(edge)),
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
export function computeLayout(nodes: LayoutNode[], edges: LayoutEdge[], direction: GraphDirection): LayoutResult {
    const deadline = performance.now() + TRIES_BUDGET_MS;
    let best = layoutOnce(nodes, edges, direction);
    if (nodes.length > MAX_NODES_FOR_TRIES) {
        return best;
    }
    for (let seed = 1; seed < LAYOUT_TRIES && performance.now() < deadline; seed++) {
        const attempt = layoutOnce(shuffled(nodes, seed), shuffled(edges, seed + LAYOUT_TRIES), direction);
        if (attempt.score < best.score) {
            best = attempt;
        }
    }
    return best;
}
