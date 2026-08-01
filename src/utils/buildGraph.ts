import type {Mod, PrereqTree} from "../types/types";


// Two kid of vertices 
// (1) a course, (2) a logical condition 
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


function findMod(mods: Mod[], code: string): Mod | undefined {
    return mods.find(m => m.code === code);
}

let gateId = 0;
function nextGateid(): string{
    gateId++;
    return `gate-${gateId}`;
}

// For a completed mod, drop any prereq leaf whose code isn't
// in the user's tracked list, and collapse any gate that ends up empty.
function filterTree(tree: PrereqTree, trackedCodes: Set<string>): PrereqTree | null {
    if (typeof tree === "string") {
        const [code] = tree.split(":");
        return trackedCodes.has(code) ? tree : null;
    }

    const filterBranch = (branch?: PrereqTree[]) =>
        branch
            ?.map(t => filterTree(t, trackedCodes))
            .filter((t): t is PrereqTree => t !== null);

    if (tree.and) {
        const and = filterBranch(tree.and);
        return and && and.length > 0 ? { and } : null;
    }
    if (tree.or) {
        const or = filterBranch(tree.or);
        return or && or.length > 0 ? { or } : null;
    }
    if (tree.nOf) {
        const [n, kids] = tree.nOf;
        const filtered = filterBranch(kids);
        return filtered && filtered.length > 0 ? { nOf: [n, filtered] } : null;
    }
    return null;
}

interface WalkResult {
    id: string;
    minGrade?: string;
    fulfilled: boolean;
}

// generate all required children
// not all modules added by uses is a pre-req etc..
function walkTree(tree: PrereqTree, mods: Mod[], graph: Graph): WalkResult{
    // leaf -> mod without any prereq
    if (typeof tree == "string"){
        const [code, minGrade] = tree.split(":");
        const exist = findMod(mods, code);
        // not added yet
        if (!graph.nodes.has(code)){
            graph.nodes.set(code,{
                kind:"module",
                id: code,
                code,
                title: exist?.title,
                completed: exist?.completed ?? false,
                tracked: !!exist,
            });
        }
        return { id: code, minGrade, fulfilled: exist?.completed ?? false };
    }

    let gateType: "and"|"or"|"nOf";
    let children: PrereqTree[];
    let n: number |undefined;
    if (tree.and){
        // AND requirement 
        gateType = "and";
        children = tree.and;
    } else if (tree.or) {
        gateType = "or";
        children = tree.or;
    } else{
        gateType = "nOf";
        n = tree.nOf![0]; 
        children  = tree.nOf![1];
    }

    // walk children first so we know their fulfilled status
    // before deciding whether this gate itself is fulfilled
    const childResults = children.map(child => walkTree(child, mods, graph));

    let fulfilled: boolean;
    if (gateType === "and"){
        fulfilled = childResults.every(r => r.fulfilled);
    } else if (gateType === "or"){
        fulfilled = childResults.some(r => r.fulfilled);
    } else {
        fulfilled = childResults.filter(r => r.fulfilled).length >= n!;
    }

    const thisGateId = nextGateid();
    graph.nodes.set(thisGateId, {
        kind: "gate",
        id: thisGateId,
        gateType,
        n,
        fulfilled,
    });

    // Once a gate is fulfilled, drawing edges to every non-contributing
    // child is just clutter - e.g. an OR gate satisfied by 2 of 10 courses
    // doesn't need the other 8 drawn here. Only skip this for AND gates,
    // where every child is fulfilled anyway once the gate is fulfilled.
    const resultsToShow = (fulfilled && gateType !== "and")
        ? childResults.filter(r => r.fulfilled)
        : childResults;

    for (const result of resultsToShow){
        graph.edges.push({from: result.id, to: thisGateId, minGrade: result.minGrade});
    }
    return { id: thisGateId, fulfilled };
}

// A child excluded above (non-contributing to a fulfilled gate) may still
// have its OWN children wired up beneath it from the recursive walk - that
// whole sub-tree is now a self-contained island with no path back up to any
// course. This does a proper reachability pass from the real, tracked
// courses down through the edges, and removes anything - node or edge -
// that isn't actually connected to one. This correctly drops whole
// disconnected islands together, rather than leaving fragments behind.
function pruneUnreachable(graph: Graph){
    // childrenOf[parentId] = every node that points up TO parentId
    // (edges are stored as {from: child, to: parent})
    const childrenOf = new Map<string, string[]>();
    for (const edge of graph.edges){
        if (!childrenOf.has(edge.to)) childrenOf.set(edge.to, []);
        childrenOf.get(edge.to)!.push(edge.from);
    }

    // Seed with the real courses (tracked mods) - every legitimate edge
    // chain in the graph originates from one of these.
    const reachable = new Set<string>();
    const queue: string[] = [];
    for (const [id, node] of graph.nodes){
        if (node.kind === "module" && node.tracked){
            reachable.add(id);
            queue.push(id);
        }
    }

    while (queue.length){
        const current = queue.pop()!;
        for (const child of childrenOf.get(current) ?? []){
            if (!reachable.has(child)){
                reachable.add(child);
                queue.push(child);
            }
        }
    }

    for (const id of Array.from(graph.nodes.keys())){
        if (!reachable.has(id)) graph.nodes.delete(id);
    }
    graph.edges = graph.edges.filter(e => graph.nodes.has(e.from) && graph.nodes.has(e.to));
}

export function buildGraph(mods: Mod[]) : Graph{
    const graph: Graph = {nodes: new Map(), edges:[]};
    const trackedCodes = new Set(mods.map(m => m.code));

    for (const mod of mods){
        graph.nodes.set(mod.code, {
            kind:"module",
            id: mod.code,
            code: mod.code,
            title:mod.title,
            completed: mod.completed,
            tracked: true,
        });

        if (mod.prereqTree){
            const treeToRender = mod.completed
                ? filterTree(mod.prereqTree, trackedCodes)
                : mod.prereqTree;

            if (treeToRender){
                const root = walkTree(treeToRender, mods, graph);
                graph.edges.push({from: root.id, to: mod.code, minGrade: root.minGrade});
            }
        }
    }

    pruneUnreachable(graph);
    return graph;
}