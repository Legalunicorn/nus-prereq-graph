import type { Mod, PrereqTree } from "../types/types";
import type { Graph } from "../types/graph";
import type { AlternativeOptions } from "./alternatives";
import { isDone } from "./modStatus";
import { filterTree, normalizeTree } from "./prereqTree";
import { edgeStatus, walkTree, pruneUnreachable } from "./walkTree";

interface BuildOptions {
    treeOf?: (code: string) => PrereqTree | undefined;
    alternatives?: AlternativeOptions;
}

export function buildGraph(mods: Mod[], options: BuildOptions = {}) : Graph{
    const graph: Graph = {nodes: new Map(), edges:[]};
    const trackedCodes = new Set(mods.map(m => m.code));
    const ctx = { mods, graph, ...options };

    for (const mod of mods){
        graph.nodes.set(mod.code, {
            kind:"module", id: mod.code, code: mod.code,
            title:mod.title, completed: mod.completed, taking: !!mod.taking, tracked: true,
        });

        const isModDone = isDone(mod);
        const prereqTree = mod.prereqTree ? normalizeTree(mod.prereqTree) : null;
        if (prereqTree){
            const treeToRender = isModDone ? filterTree(prereqTree, trackedCodes) : prereqTree;
            if (treeToRender){
                const root = walkTree(treeToRender, ctx, mod.code, isModDone);
                graph.edges.push({
                    from: root.id,
                    to: mod.code,
                    minGrade: root.minGrade,
                    status: edgeStatus(root.fulfilled, isModDone),
                });
                const courseNode = graph.nodes.get(mod.code);
                if (courseNode?.kind === "module") {
                    courseNode.prereqUnfulfilled = !isModDone && !root.fulfilled;
                }
            }
        }
    }
    pruneUnreachable(graph);
    return graph;
}
