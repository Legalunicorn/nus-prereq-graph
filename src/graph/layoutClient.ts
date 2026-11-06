import type { GraphDirection } from "./cytoscapeConfig";
import type { LayoutEdge, LayoutNode, LayoutResult } from "./graphLayout";

export interface LayoutRequest {
    id: number;
    nodes: LayoutNode[];
    edges: LayoutEdge[];
    direction: GraphDirection;
}

const MAX_CACHED = 16;

const cache = new Map<string, LayoutResult>();
const pending = new Map<number, (layout: LayoutResult) => void>();
let nextId = 0;
let worker: Worker | null | undefined;

export const layoutKey = (nodes: LayoutNode[], edges: LayoutEdge[], direction: GraphDirection) =>
    JSON.stringify([direction, nodes, edges]);

function remember(key: string, layout: LayoutResult) {
    cache.set(key, layout);
    if (cache.size > MAX_CACHED) {
        cache.delete(cache.keys().next().value as string);
    }
}

function getWorker() {
    if (worker === undefined) {
        try {
            worker = new Worker(new URL("./layout.worker.ts", import.meta.url), { type: "module" });
            worker.addEventListener("message", ({ data }: MessageEvent<{ id: number; layout: LayoutResult }>) => {
                pending.get(data.id)?.(data.layout);
                pending.delete(data.id);
            });
        } catch {
            worker = null;
        }
    }
    return worker;
}

/** Runs the layout off the main thread when possible, as it takes long enough to freeze the page. */
export async function requestLayout(nodes: LayoutNode[], edges: LayoutEdge[], direction: GraphDirection): Promise<LayoutResult> {
    const key = layoutKey(nodes, edges, direction);
    const cached = cache.get(key);
    if (cached) {
        return cached;
    }
    const background = getWorker();
    if (!background) {
        const { computeLayout } = await import("./graphLayout");
        const layout = computeLayout(nodes, edges, direction);
        remember(key, layout);
        return layout;
    }
    return new Promise(resolve => {
        const id = nextId++;
        pending.set(id, layout => {
            remember(key, layout);
            resolve(layout);
        });
        background.postMessage({ id, nodes, edges, direction } satisfies LayoutRequest);
    });
}
