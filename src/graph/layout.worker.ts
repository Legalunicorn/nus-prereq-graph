import { computeLayout } from "./graphLayout";
import type { LayoutRequest } from "./layoutClient";

self.addEventListener("message", ({ data }: MessageEvent<LayoutRequest>) => {
    postMessage({ id: data.id, layout: computeLayout(data.nodes, data.edges, data.direction) });
});
