import type { Mod, PrereqTree } from "../types/types";

/** A prerequisite like CS1010% stands for any module starting with CS1010. */
export function isWildcard(code: string): boolean {
    return code.includes("%");
}

export function matchesWildcard(wildcard: string, code: string): boolean {
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
