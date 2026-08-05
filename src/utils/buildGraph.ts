import type { Mod } from "../types/types";
import type { Graph } from "../types/graph";
import { filterTree, walkTree, pruneUnreachable } from "./graphHelpers";

export function buildGraph(mods: Mod[]) : Graph{
    const graph: Graph = {nodes: new Map(), edges:[]};
    const trackedCodes = new Set(mods.map(m => m.code));

    for (const mod of mods){
        graph.nodes.set(mod.code, {
            kind:"module", id: mod.code, code: mod.code,
            title:mod.title, completed: mod.completed, tracked: true,
        });

        if (mod.prereqTree){
            const treeToRender = mod.completed ? filterTree(mod.prereqTree, trackedCodes) : mod.prereqTree;
            if (treeToRender){
                const root = walkTree(treeToRender, mods, graph);
                graph.edges.push({from: root.id, to: mod.code, minGrade: root.minGrade});
            }
        }
    }
    pruneUnreachable(graph);
    return graph;
}