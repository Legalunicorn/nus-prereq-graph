import type { Mod, PrereqTree } from "../types/types";
import type { EdgeStatus, Graph } from "../types/graph";
import { MAX_VISIBLE_ALTERNATIVES } from "./alternatives";
import type { AlternativeOptions } from "./alternatives";
import { isDone } from "./modStatus";

/** A prerequisite like CS1010% stands for any module starting with CS1010. */
export function isWildcard(code: string): boolean {
    return code.includes("%");
}

function matchesWildcard(wildcard: string, code: string): boolean {
    return code.startsWith(wildcard.slice(0, wildcard.indexOf("%")));
}

export function findMod(mods: Mod[], code: string): Mod | undefined {
    return mods.find(m => m.code === code);
}

/**
 * Reduces a tree from the API to just its course requirements.
 * `then` is the requirement behind a cohort or programType condition. A bare
 * condition has no course to show, so it is dropped.
 */
export function normalizeTree(tree: PrereqTree): PrereqTree | null {
    if (typeof tree === "string") {
        return tree;
    }

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

export function edgeStatus(fulfilled: boolean, isCleared: boolean): EdgeStatus {
    if (fulfilled) {
        return "fulfilled";
    }
    return isCleared ? "cleared" : "unfulfilled";
}

export interface WalkContext {
    mods: Mod[];
    graph: Graph;
    /** When set, modules not in the plan are expanded using these trees, to show the full chain. */
    treeOf?: (code: string) => PrereqTree | undefined;
    /** When set, long unfulfilled OR lists are collapsed behind a "more" node. */
    alternatives?: AlternativeOptions;
}

function collapseAlternatives(
    results: WalkResult[],
    gateId: string,
    graph: Graph,
    { rank, expanded }: AlternativeOptions,
): WalkResult[] {
    if (results.length <= MAX_VISIBLE_ALTERNATIVES) {
        return results;
    }

    const isExpanded = expanded.has(gateId);
    const hiddenCount = results.length - MAX_VISIBLE_ALTERNATIVES;
    const moreId = `more:${gateId}`;
    graph.nodes.set(moreId, { kind: "more", id: moreId, gateId, hiddenCount, expanded: isExpanded });
    graph.edges.push({ from: moreId, to: gateId, status: "cleared" });
    if (isExpanded) {
        return results;
    }

    // A nested gate is a requirement in its own right, so it always ranks first.
    const rankOf = (result: WalkResult) => (result.id.startsWith("gate:") ? -1 : rank(result.id));
    return [...results].sort((a, b) => rankOf(a) - rankOf(b)).slice(0, MAX_VISIBLE_ALTERNATIVES);
}

function expandUntracked(code: string, ctx: WalkContext) {
    const tree = ctx.treeOf?.(code);
    const normalized = tree ? normalizeTree(tree) : null;
    if (!normalized) {
        return;
    }
    const root = walkTree(normalized, ctx, code);
    ctx.graph.edges.push({
        from: root.id,
        to: code,
        minGrade: root.minGrade,
        status: edgeStatus(root.fulfilled, false),
    });
}

/**
 * `path` is this tree's position under its module, which keeps gate IDs the same between builds.
 * With `isCleared` set, the tree belongs to a completed module, so nothing in it renders as unmet.
 */
export function walkTree(tree: PrereqTree, ctx: WalkContext, path: string, isCleared = false): WalkResult{
    const { mods, graph } = ctx;
    if (typeof tree === "string"){
        const [code, minGrade] = tree.split(":");
        const exist = findMod(mods, code);
        const isMet = isWildcard(code)
            ? mods.some(mod => isDone(mod) && matchesWildcard(code, mod.code))
            : !!exist && isDone(exist);
        if (!graph.nodes.has(code)){
            graph.nodes.set(code,{
                kind:"module",
                id: code,
                code,
                title: exist?.title,
                completed: isMet && !exist?.taking,
                taking: !!exist?.taking,
                tracked: !!exist,
            });
            if (!exist) {
                expandUntracked(code, ctx);
            }
        }
        return { id: code, minGrade, fulfilled: isMet };
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

    const childResults = children.map((child, i) => walkTree(child, ctx, `${path}.${i}`, isCleared));

    let fulfilled: boolean;
    if (gateType === "and"){
        fulfilled = childResults.every(r => r.fulfilled);
    } else if (gateType === "or"){
        fulfilled = childResults.some(r => r.fulfilled);
    } else {
        fulfilled = childResults.filter(r => r.fulfilled).length >= n!;
    }

    const thisGateId = `gate:${path}`;
    graph.nodes.set(thisGateId, {
        kind: "gate",
        id: thisGateId,
        gateType,
        n,
        fulfilled: fulfilled || isCleared,
    });

    const collapsible = gateType === "or" && !fulfilled && !isCleared && ctx.alternatives;
    const resultsToShow = collapsible
        ? collapseAlternatives(childResults, thisGateId, graph, collapsible)
        : (fulfilled && gateType !== "and")
            ? childResults.filter(r => r.fulfilled)
            : childResults;

    for (const result of resultsToShow){
        graph.edges.push({
            from: result.id,
            to: thisGateId,
            minGrade: result.minGrade,
            status: edgeStatus(result.fulfilled, isCleared),
        });
    }
    return { id: thisGateId, fulfilled };
}

export function pruneUnreachable(graph: Graph){
    const childrenOf = new Map<string, string[]>();
    for (const edge of graph.edges){
        if (!childrenOf.has(edge.to)) {
            childrenOf.set(edge.to, []);
        }
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
        if (!reachable.has(id)) {
            graph.nodes.delete(id);
        }
    }
    graph.edges = graph.edges.filter(e => graph.nodes.has(e.from) && graph.nodes.has(e.to));
}