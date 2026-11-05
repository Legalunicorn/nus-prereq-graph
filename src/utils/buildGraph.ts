import type { Mod, PrereqTree } from "../types/types";
import type { Graph } from "../types/graph";
import type { AlternativeOptions } from "./alternatives";
import { edgeStatus, filterTree, normalizeTree, walkTree, pruneUnreachable } from "./graphHelpers";

export interface BuildOptions {
    /** Lets modules not in the plan show their prerequisites too, giving the full chain. */
    treeOf?: (code: string) => PrereqTree | undefined;
    /** Collapses long OR lists. */
    alternatives?: AlternativeOptions;
}

export function buildGraph(mods: Mod[], options: BuildOptions = {}) : Graph{
    const graph: Graph = {nodes: new Map(), edges:[]};
    const trackedCodes = new Set(mods.map(m => m.code));
    const ctx = { mods, graph, ...options };

    for (const mod of mods){
        graph.nodes.set(mod.code, {
            kind:"module", id: mod.code, code: mod.code,
            title:mod.title, completed: mod.completed, tracked: true,
        });

        const prereqTree = mod.prereqTree ? normalizeTree(mod.prereqTree) : null;
        if (prereqTree){
            const treeToRender = mod.completed ? filterTree(prereqTree, trackedCodes) : prereqTree;
            if (treeToRender){
                const root = walkTree(treeToRender, ctx, mod.code, mod.completed);
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
