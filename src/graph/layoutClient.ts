import type { GraphDirection } from "./cytoscapeConfig";
import { computeLayout } from "./graphLayout";
import type { LayoutEdge, LayoutNode, LayoutResult } from "./graphLayout";

export interface LayoutRequest {
    id: number;
    nodes: LayoutNode[];
    edges: LayoutEdge[];
    direction: GraphDirection;
}

interface PendingLayout {
    request: LayoutRequest;
    finish: (layout: LayoutResult) => void;
}

const MAX_CACHED = 16;

const cache = new Map<string, LayoutResult>();
const pending = new Map<number, PendingLayout>();
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

/** The worker file can fail to load, such as in a tab left open across a deploy, so never wait on it forever. */
function fallBackToMainThread() {
    worker = null;
    for (const { request, finish } of pending.values()) {
        finish(computeLayout(request.nodes, request.edges, request.direction));
    }
    pending.clear();
}

function getWorker() {
    if (worker === undefined) {
        try {
            worker = new Worker(new URL("./layout.worker.ts", import.meta.url), { type: "module" });
            worker.addEventListener("message", ({ data }: MessageEvent<{ id: number; layout: LayoutResult }>) => {
                pending.get(data.id)?.finish(data.layout);
                pending.delete(data.id);
            });
            worker.addEventListener("error", fallBackToMainThread);
        } catch {
            worker = null;
        }
    }
    return worker;
}

/** Runs the layout off the main thread when possible, as it takes long enough to freeze the page. */
export function requestLayout(nodes: LayoutNode[], edges: LayoutEdge[], direction: GraphDirection): Promise<LayoutResult> {
    const key = layoutKey(nodes, edges, direction);
    const cached = cache.get(key);
    if (cached) {
        return Promise.resolve(cached);
    }
    return new Promise(resolve => {
        const finish = (layout: LayoutResult) => {
            remember(key, layout);
            resolve(layout);
        };
        const background = getWorker();
        if (!background) {
            finish(computeLayout(nodes, edges, direction));
            return;
        }
        const request: LayoutRequest = { id: nextId++, nodes, edges, direction };
        pending.set(request.id, { request, finish });
        background.postMessage(request);
    });
}
