export type Node =
    | {kind: "module"; id:string; code: string; title?: string; completed:boolean; tracked: boolean; prereqUnfulfilled?: boolean}
    | {kind: "gate"; id:string;  gateType: "and"|"or"|"nOf"; n?: number; fulfilled: boolean}
    | {kind: "more"; id:string; gateId: string; hiddenCount: number; expanded: boolean};

// "cleared" is an unmet prerequisite that no longer matters because the module it leads to is completed.
export type EdgeStatus = "fulfilled" | "unfulfilled" | "cleared";

export interface Edge {
    from: string;
    to: string;
    minGrade?: string;
    status: EdgeStatus;
}

export interface Graph{
    nodes: Map<string, Node>;
    edges: Edge[];
}
