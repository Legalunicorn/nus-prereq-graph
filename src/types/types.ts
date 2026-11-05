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

export interface Mod {
    code: string;
    title: string;
    completed: boolean;
    taking?: boolean;
    prereqTree?: PrereqTree;
    fulfillRequirements?: string[];
}

export interface Course {
    code: string;
    title: string;
    note?: string;
}
