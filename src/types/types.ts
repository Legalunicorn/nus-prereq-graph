// local storage of mods 
export type PrereqTree = 
    | string 
    | { 
        and?: PrereqTree[];
        or?: PrereqTree[];
        nOf?: PrereqTree[];
    }

export interface Mod {
    code: string;
    title: string;
    completed: boolean;
    prereqTree?: PrereqTree;
}