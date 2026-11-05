import type { PrereqTree } from "../types/types";
import { normalizeTree } from "./graphHelpers";
import type { SnapshotModule } from "./snapshot";

export type RegularSemester = 1 | 2;

// The tree lists these for some first-year modules, but H2 Maths or equivalent also qualifies.
const ASSUMED_DONE = ["MA1301", "MA1301X"];
const NOT_POSSIBLE = Infinity;
const ALREADY_DONE = -1;

/** Sem 1 runs August to December, so from August the next semester to plan for is Sem 2. */
export function nextSemester(today: Date): RegularSemester {
    return today.getMonth() >= 7 ? 2 : 1;
}

interface EstimatorOptions {
    modules: Record<string, SnapshotModule>;
    completed: ReadonlySet<string>;
    start: RegularSemester;
}

/**
 * Returns a function giving the minimum number of semesters to finish a module: 0 if it's
 * completed, or null if it can't be worked out, such as a module outside the snapshot or
 * one with no regular semester offering. It works on term numbers counted from `start`.
 */
export function createEstimator({ modules, completed, start }: EstimatorOptions) {
    const memo = new Map<string, number>();
    const inProgress = new Set<string>();
    const allCodes = [...Object.keys(modules), ...completed];

    const semesterOfTerm = (term: number) => ((start - 1 + term) % 2) + 1;

    const matchingCodes = (code: string) => {
        if (!code.includes("%")) return [code];
        const prefix = code.slice(0, code.indexOf("%"));
        return allCodes.filter(candidate => candidate.startsWith(prefix));
    };

    const earliestTerm = (code: string): number => {
        if (completed.has(code) || ASSUMED_DONE.includes(code)) return ALREADY_DONE;
        const known = memo.get(code);
        if (known !== undefined) return known;
        const mod = modules[code];
        if (!mod || inProgress.has(code)) return NOT_POSSIBLE;

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
        if (tree.and) return Math.max(...tree.and.map(evaluate));
        if (tree.or) return Math.min(...tree.or.map(evaluate));
        if (tree.nOf) {
            const [n, kids] = tree.nOf;
            const sorted = kids.map(evaluate).sort((a, b) => a - b);
            return sorted[n - 1] ?? NOT_POSSIBLE;
        }
        return ALREADY_DONE;
    };

    return (code: string): number | null => {
        const term = earliestTerm(code);
        return term === NOT_POSSIBLE ? null : term + 1;
    };
}
