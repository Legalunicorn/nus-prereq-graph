import type { Mod, PrereqTree, Term } from "../types/types";
import { isDone } from "./modStatus";
import { isOffered } from "./offerings";
import type { Offerings } from "./offerings";
import { isWildcard, matchesWildcard, normalizeTree } from "./prereqTree";

export const TERMS: readonly Term[] = ["Y1S1", "Y1S2", "Y2S1", "Y2S2", "Y3S1", "Y3S2", "Y4S1", "Y4S2"];

const semesterOf = (term: Term) => Number(term.slice(-1));
const matches = (leaf: string, code: string) => (isWildcard(leaf) ? matchesWildcard(leaf, code) : leaf === code);

function isSatisfied(tree: PrereqTree, codes: readonly string[]): boolean {
    if (typeof tree === "string") {
        const [leaf] = tree.split(":");
        return codes.some(code => matches(leaf, code));
    }
    if (tree.and) {
        return tree.and.every(child => isSatisfied(child, codes));
    }
    if (tree.or) {
        return tree.or.some(child => isSatisfied(child, codes));
    }
    if (tree.nOf) {
        const [needed, children] = tree.nOf;
        return children.filter(child => isSatisfied(child, codes)).length >= needed;
    }
    return true;
}

function leavesOf(tree: PrereqTree): string[] {
    if (typeof tree === "string") {
        return [tree.split(":")[0]];
    }
    return [...(tree.and ?? []), ...(tree.or ?? []), ...(tree.nOf?.[1] ?? [])].flatMap(leavesOf);
}

/**
 * Warns about a prerequisite planned for the same term or later, and a module not offered in its
 * planned semester. Offerings are this AY's, so warnings for later years are estimates. A module
 * in the plan with no term isn't treated as late, as its timing isn't known yet.
 */
export function planWarnings(mods: Mod[], offerings: Offerings | null): Map<string, string[]> {
    const warnings = new Map<string, string[]>();
    for (const mod of mods) {
        const term = mod.plannedTerm;
        if (!term || isDone(mod)) {
            continue;
        }
        const messages: string[] = [];
        const semester = semesterOf(term);
        if (offerings && offerings.size > 0 && !(isOffered(offerings, mod.code) && offerings.get(mod.code)?.semesters.includes(semester))) {
            messages.push(`Not offered in S${semester} this AY`);
        }

        const tree = mod.prereqTree ? normalizeTree(mod.prereqTree) : null;
        if (tree) {
            const isLate = (other: Mod) => !isDone(other) && !!other.plannedTerm
                && TERMS.indexOf(other.plannedTerm) >= TERMS.indexOf(term);
            const others = mods.filter(other => other.code !== mod.code);
            const inTime = others.filter(other => !isLate(other)).map(other => other.code);
            const late = others.filter(isLate).map(other => other.code);
            if (!isSatisfied(tree, inTime) && isSatisfied(tree, [...inTime, ...late])) {
                const leaves = leavesOf(tree);
                const culprits = late.filter(code => leaves.some(leaf => matches(leaf, code)));
                messages.push(`Prerequisite planned too late: ${culprits.join(", ")}`);
            }
        }
        if (messages.length > 0) {
            warnings.set(mod.code, messages);
        }
    }
    return warnings;
}

export interface TermGroup {
    term: Term | null;
    mods: Mod[];
    credits: number;
}

/** Groups by term in order, with modules that have no term last. */
export function groupByTerm(mods: Mod[], creditsOf: (code: string) => number): TermGroup[] {
    return [...TERMS, null].flatMap(term => {
        const inTerm = mods.filter(mod => (mod.plannedTerm ?? null) === term);
        if (inTerm.length === 0) {
            return [];
        }
        return [{ term, mods: inTerm, credits: inTerm.reduce((sum, mod) => sum + creditsOf(mod.code), 0) }];
    });
}
