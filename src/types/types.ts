// Non-course conditions that the NUSMods API can put in a prerequisite tree.
export interface CohortRule { rule: string; years: string[]; }
export interface ProgramTypeRule { rule: string; types: string[]; }

// local storage of mods
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
    prereqTree?: PrereqTree;
    fulfillRequirements?: string[];
}