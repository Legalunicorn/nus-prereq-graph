import type { PrereqTree } from "../types/types";
import { normalizeTree } from "../graph/prereqTree";
import type { SnapshotModule } from "../utils/snapshot";

export type RegularSemester = 1 | 2;

// The tree lists these for some first-year modules, but H2 Maths or equivalent also qualifies.
const ASSUMED_DONE = ["MA1301", "MA1301X"];
const NOT_POSSIBLE = Infinity;
const ALREADY_DONE = -1;

export const minSemestersLabel = (semesters: number) => `min ${semesters} ${semesters === 1 ? "sem" : "sems"}`;

/** Sem 1 runs August to December, so from August the next semester to plan for is Sem 2. */
export function nextSemester(today: Date): RegularSemester {
    return today.getMonth() >= 7 ? 2 : 1;
}

interface EstimatorOptions {
    modules: Record<string, SnapshotModule>;
    completed: ReadonlySet<string>;
    start: RegularSemester;
    /** Chosen first when several prerequisites tie, usually the modules in the plan. */
    preferred?: ReadonlySet<string>;
}

/**
 * `estimate` gives the minimum number of semesters to finish a module: 0 if it's completed, or
 * null if it can't be worked out, such as a module outside the snapshot or one with no regular
 * semester offering. It works on term numbers counted from `start`.
 */
export function createEstimator({ modules, completed, start, preferred = new Set() }: EstimatorOptions) {
    const memo = new Map<string, number>();
    const inProgress = new Set<string>();
    const allCodes = [...Object.keys(modules), ...completed];

    const semesterOfTerm = (term: number) => ((start - 1 + term) % 2) + 1;

    const matchingCodes = (code: string) => {
        if (!code.includes("%")) {
            return [code];
        }
        const prefix = code.slice(0, code.indexOf("%"));
        return allCodes.filter(candidate => candidate.startsWith(prefix));
    };

    const earliestTerm = (code: string): number => {
        if (completed.has(code) || ASSUMED_DONE.includes(code)) {
            return ALREADY_DONE;
        }
        const known = memo.get(code);
        if (known !== undefined) {
            return known;
        }
        const mod = modules[code];
        if (!mod || inProgress.has(code)) {
            return NOT_POSSIBLE;
        }

        inProgress.add(code);
        const tree = mod.prereqTree ? normalizeTree(mod.prereqTree) : null;
        const prereqsDone = tree ? evaluate(tree) : ALREADY_DONE;
        inProgress.delete(code);

        const firstFree = prereqsDone + 1;
        const offeredTerm = [firstFree, firstFree + 1]
            .find(term => mod.semesters.includes(semesterOfTerm(term)));
        const result = offeredTerm ?? NOT_POSSIBLE;
        memo.set(code, result);
        return result;
    };

    const evaluate = (tree: PrereqTree): number => {
        if (typeof tree === "string") {
            const options = matchingCodes(tree.split(":")[0]).map(earliestTerm);
            return Math.min(NOT_POSSIBLE, ...options);
        }
        if (tree.and) {
            return Math.max(...tree.and.map(evaluate));
        }
        if (tree.or) {
            return Math.min(...tree.or.map(evaluate));
        }
        if (tree.nOf) {
            const [n, kids] = tree.nOf;
            const sorted = kids.map(evaluate).sort((a, b) => a - b);
            return sorted[n - 1] ?? NOT_POSSIBLE;
        }
        return ALREADY_DONE;
    };

    const oneAlternative = (alternatives: string[][]) =>
        alternatives.find(codes => codes.some(code => preferred.has(code))) ?? alternatives[0] ?? [];

    /** Every AND branch tied for last decides the time, but only one of a set of alternatives needs taking. */
    const decidingCodes = (tree: PrereqTree): string[] => {
        const term = evaluate(tree);
        if (typeof tree === "string") {
            const tied = matchingCodes(tree.split(":")[0]).filter(code => earliestTerm(code) === term);
            return oneAlternative(tied.map(code => [code]));
        }
        const kids = tree.and ?? tree.or ?? tree.nOf?.[1] ?? [];
        const tied = kids.filter(kid => evaluate(kid) === term).map(decidingCodes);
        return tree.and ? tied.flat() : oneAlternative(tied);
    };

    const isPending = (code: string) => earliestTerm(code) >= 0 && earliestTerm(code) !== NOT_POSSIBLE;

    const longestChains = (code: string): string[][] => {
        const chains: string[][] = [];
        const walk = (current: string, later: string[]) => {
            const chain = [current, ...later];
            const prereqTree = modules[current]?.prereqTree;
            const tree = prereqTree ? normalizeTree(prereqTree) : null;
            const previous = (tree ? decidingCodes(tree) : [])
                .filter(other => isPending(other) && !chain.includes(other));
            if (previous.length === 0) {
                chains.push(chain);
            }
            previous.forEach(other => walk(other, chain));
        };
        if (isPending(code)) {
            walk(code, []);
        }
        return chains;
    };

    return {
        estimate: (code: string): number | null => {
            const term = earliestTerm(code);
            return term === NOT_POSSIBLE ? null : term + 1;
        },

        /** Every chain of modules still to take that decides how long `code` takes, earliest first. */
        longestChains,

        /** Spells out one deciding chain by semester, including any semester spent waiting for an offering. */
        explain: (code: string): string | null => {
            const [chain] = longestChains(code);
            if (!chain) {
                return null;
            }
            const steps = Array.from({ length: earliestTerm(code) + 1 }, (_, term) => {
                const taken = chain.find(other => earliestTerm(other) === term);
                return `S${semesterOfTerm(term)}: ${taken ?? "wait"}`;
            });
            return steps.join(" → ");
        },
    };
}
