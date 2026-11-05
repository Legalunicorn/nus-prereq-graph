import type { Graph, Node } from "../types/graph";
import { isOffered, semesterLabel } from "./offerings";
import type { Offerings } from "./offerings";

function gateLabel(node: Extract<Node, { kind: "gate" }>): string {
    if (node.gateType === "and") return "AND";
    if (node.gateType === "or") return "OR";
    return `${node.n} OF`;
}

function nodeData(node: Node, offerings: Offerings | null) {
    if (node.kind === "module") {
        return {
            id: node.id,
            label: offerings ? `${node.code}\n${semesterLabel(offerings, node.code)}` : node.code,
            kind: node.kind,
            completed: node.completed,
            tracked: node.tracked,
            prereqUnfulfilled: node.prereqUnfulfilled ?? false,
            notOffered: offerings ? !isOffered(offerings, node.code) : false,
        };
    }
    return { id: node.id, label: gateLabel(node), kind: node.kind, fulfilled: node.fulfilled };
}

/** Converts a graph to cytoscape elements with stable IDs, so updates can be matched to what's on screen. */
export function toElements(graph: Graph, offerings: Offerings | null = null) {
    const edges = new Map(graph.edges.map(edge => {
        const id = `${edge.from}->${edge.to}`;
        return [id, {
            data: {
                id,
                source: edge.from,
                target: edge.to,
                minGrade: edge.minGrade ?? "",
                status: edge.status,
            },
        }];
    }));

    return [
        ...Array.from(graph.nodes.values(), node => ({ data: nodeData(node, offerings) })),
        ...edges.values(),
    ];
}
