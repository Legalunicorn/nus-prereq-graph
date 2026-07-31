// local storage of mods 
export type PrereqTree = 
    | string 
    | { 
        and?: PrereqTree[];
        or?: PrereqTree[];
        nOf?: [number, PrereqTree[]];
    }

export interface Mod {
    code: string;
    title: string;
    completed: boolean;
    prereqTree?: PrereqTree;
    fulfillRequirements?: string[];
}