import type { Mod, PrereqTree } from "../types/types";
import type { EdgeStatus, Graph } from "../types/graph";

export function findMod(mods: Mod[], code: string): Mod | undefined {
    return mods.find(m => m.code === code);
}

let gateId = 0;
export function nextGateid(): string{
    gateId++;
    return `gate-${gateId}`;
}

/**
 * Reduces a tree from the API to just its course requirements.
 * `then` is the requirement behind a cohort or programType condition. A bare
 * condition has no course to show, so it is dropped.
 */
export function normalizeTree(tree: PrereqTree): PrereqTree | null {
    if (typeof tree === "string") return tree;

    const normalizeBranch = (branch: PrereqTree[]) =>
        branch.map(normalizeTree).filter((t): t is PrereqTree => t !== null);

    if (tree.and) {
        const and = normalizeBranch(tree.and);
        return and.length > 0 ? { and } : null;
    }
    if (tree.or) {
        const or = normalizeBranch(tree.or);
        return or.length > 0 ? { or } : null;
    }
    if (tree.nOf) {
        const [n, kids] = tree.nOf;
        const normalized = normalizeBranch(kids);
        return normalized.length > 0 ? { nOf: [n, normalized] } : null;
    }
    return tree.then ? normalizeTree(tree.then) : null;
}

export function filterTree(tree: PrereqTree, trackedCodes: Set<string>): PrereqTree | null {
    if (typeof tree === "string") {
        const [code] = tree.split(":");
        return trackedCodes.has(code) ? tree : null;
    }

    const filterBranch = (branch?: PrereqTree[]) =>
        branch
            ?.map(t => filterTree(t, trackedCodes))
            .filter((t): t is PrereqTree => t !== null);

    if (tree.and) {
        const and = filterBranch(tree.and);
        return and && and.length > 0 ? { and } : null;
    }
    if (tree.or) {
        const or = filterBranch(tree.or);
        return or && or.length > 0 ? { or } : null;
    }
    if (tree.nOf) {
        const [n, kids] = tree.nOf;
        const filtered = filterBranch(kids);
        return filtered && filtered.length > 0 ? { nOf: [n, filtered] } : null;
    }
    return null;
}

export interface WalkResult {
    id: string;
    minGrade?: string;
    fulfilled: boolean;
}

export function edgeStatus(fulfilled: boolean, cleared: boolean): EdgeStatus {
    if (fulfilled) return "fulfilled";
    return cleared ? "cleared" : "unfulfilled";
}

/** With `cleared` set, the tree belongs to a completed module, so nothing in it renders as unmet. */
export function walkTree(tree: PrereqTree, mods: Mod[], graph: Graph, cleared = false): WalkResult{
    if (typeof tree == "string"){
        const [code, minGrade] = tree.split(":");
        const exist = findMod(mods, code);
        if (!graph.nodes.has(code)){
            graph.nodes.set(code,{
                kind:"module",
                id: code,
                code,
                title: exist?.title,
                completed: exist?.completed ?? false,
                tracked: !!exist,
            });
        }
        return { id: code, minGrade, fulfilled: exist?.completed ?? false };
    }

    let gateType: "and"|"or"|"nOf";
    let children: PrereqTree[];
    let n: number |undefined;
    if (tree.and){
        gateType = "and";
        children = tree.and;
    } else if (tree.or) {
        gateType = "or";
        children = tree.or;
    } else{
        gateType = "nOf";
        n = tree.nOf![0]; 
        children  = tree.nOf![1];
    }

    const childResults = children.map(child => walkTree(child, mods, graph, cleared));

    let fulfilled: boolean;
    if (gateType === "and"){
        fulfilled = childResults.every(r => r.fulfilled);
    } else if (gateType === "or"){
        fulfilled = childResults.some(r => r.fulfilled);
    } else {
        fulfilled = childResults.filter(r => r.fulfilled).length >= n!;
    }

    const thisGateId = nextGateid();
    graph.nodes.set(thisGateId, {
        kind: "gate",
        id: thisGateId,
        gateType,
        n,
        fulfilled: fulfilled || cleared,
    });

    const resultsToShow = (fulfilled && gateType !== "and")
        ? childResults.filter(r => r.fulfilled)
        : childResults;

    for (const result of resultsToShow){
        graph.edges.push({
            from: result.id,
            to: thisGateId,
            minGrade: result.minGrade,
            status: edgeStatus(result.fulfilled, cleared),
        });
    }
    return { id: thisGateId, fulfilled };
}

export function pruneUnreachable(graph: Graph){
    const childrenOf = new Map<string, string[]>();
    for (const edge of graph.edges){
        if (!childrenOf.has(edge.to)) childrenOf.set(edge.to, []);
        childrenOf.get(edge.to)!.push(edge.from);
    }

    const reachable = new Set<string>();
    const queue: string[] = [];
    for (const [id, node] of graph.nodes){
        if (node.kind === "module" && node.tracked){
            reachable.add(id);
            queue.push(id);
        }
    }

    while (queue.length){
        const current = queue.pop()!;
        for (const child of childrenOf.get(current) ?? []){
            if (!reachable.has(child)){
                reachable.add(child);
                queue.push(child);
            }
        }
    }

    for (const id of Array.from(graph.nodes.keys())){
        if (!reachable.has(id)) graph.nodes.delete(id);
    }
    graph.edges = graph.edges.filter(e => graph.nodes.has(e.from) && graph.nodes.has(e.to));
}