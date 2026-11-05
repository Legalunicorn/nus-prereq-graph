// Non-course conditions that the NUSMods API can put in a prerequisite tree.
interface CohortRule { rule: string; years: string[]; }
interface ProgramTypeRule { rule: string; types: string[]; }

export type PrereqTree =
    | string
    | {
        and?: PrereqTree[];
        or?: PrereqTree[];
        nOf?: [number, PrereqTree[]];
        cohort?: CohortRule;
        programType?: ProgramTypeRule;
        then?: PrereqTree;
    }

export type Term = "Y1S1" | "Y1S2" | "Y2S1" | "Y2S2" | "Y3S1" | "Y3S2" | "Y4S1" | "Y4S2";

export interface Mod {
    code: string;
    title: string;
    completed: boolean;
    taking?: boolean;
    plannedTerm?: Term;
    prereqTree?: PrereqTree;
    fulfillRequirements?: string[];
}

export interface Course {
    code: string;
    title: string;
    note?: string;
}
