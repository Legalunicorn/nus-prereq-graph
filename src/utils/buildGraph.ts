import type { Mod } from "../types/types";
import type { Graph } from "../types/graph";
import { edgeStatus, filterTree, normalizeTree, walkTree, pruneUnreachable } from "./graphHelpers";

export function buildGraph(mods: Mod[]) : Graph{
    const graph: Graph = {nodes: new Map(), edges:[]};
    const trackedCodes = new Set(mods.map(m => m.code));

    for (const mod of mods){
        graph.nodes.set(mod.code, {
            kind:"module", id: mod.code, code: mod.code,
            title:mod.title, completed: mod.completed, tracked: true,
        });

        const prereqTree = mod.prereqTree ? normalizeTree(mod.prereqTree) : null;
        if (prereqTree){
            const treeToRender = mod.completed ? filterTree(prereqTree, trackedCodes) : prereqTree;
            if (treeToRender){
                const root = walkTree(treeToRender, mods, graph, mod.completed);
                graph.edges.push({
                    from: root.id,
                    to: mod.code,
                    minGrade: root.minGrade,
                    status: edgeStatus(root.fulfilled, mod.completed),
                });
                const courseNode = graph.nodes.get(mod.code);
                if (courseNode?.kind === "module") {
                    courseNode.prereqUnfulfilled = !mod.completed && !root.fulfilled;
                }
            }
        }
    }
    pruneUnreachable(graph);
    return graph;
}
