export type Node = 
    | {kind: "module"; id:string; code: string; title?: string; completed:boolean; tracked: boolean}
    | {kind: "gate"; id:string;  gateType: "and"|"or"|"nOf"; n?: number; fulfilled: boolean};

export interface Edge {
    from: string; 
    to: string;
    minGrade?: string;
}

export interface Graph{
    nodes: Map<string, Node>;
    edges: Edge[];
}