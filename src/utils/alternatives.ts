import { CS_FOUNDATION_COURSES } from "../data/csFoundation";
import { CS_MATH_AND_SCIENCE_COURSES } from "../data/csMathAndScience";
import { isOffered } from "./offerings";
import type { Offerings } from "./offerings";

export const MAX_VISIBLE_ALTERNATIVES = 2;

// The usual choices for a CS student. CS1101S isn't a foundation module but is the common first one.
const USUAL_CODES = new Set([
    "CS1101S",
    ...CS_FOUNDATION_COURSES.map(course => course.code),
    ...CS_MATH_AND_SCIENCE_COURSES.map(course => course.code),
]);

export interface AlternativeOptions {
    /** Lower ranks are shown first when an OR gate's list is collapsed. */
    rank: (code: string) => number;
    /** Gates the user has expanded. */
    expanded: ReadonlySet<string>;
}

/** Ranks by what's most useful to see: in the plan, then usual choices, then offered this AY. */
export function createRank(trackedCodes: ReadonlySet<string>, offerings: Offerings | null) {
    return (code: string): number => {
        if (trackedCodes.has(code)) return 0;
        if (USUAL_CODES.has(code)) return 1;
        return offerings && !isOffered(offerings, code) ? 3 : 2;
    };
}
