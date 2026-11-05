import type { Graph, Node } from "../types/graph";
import { isWildcard } from "./graphHelpers";
import { isOffered, semesterLabel } from "./offerings";
import type { Offerings } from "./offerings";

const USUAL_MIN_GRADE = "D";

function gateLabel(node: Extract<Node, { kind: "gate" }>): string {
    if (node.gateType === "and") return "AND";
    if (node.gateType === "or") return "OR";
    return `${node.n} OF`;
}

function nodeData(node: Node, offerings: Offerings | null) {
    if (node.kind === "module") {
        const wildcard = isWildcard(node.code);
        const displayCode = wildcard ? node.code.replaceAll("%", "*") : node.code;
        const code = node.completed ? `✓ ${displayCode}` : displayCode;
        const catalogue = wildcard ? null : offerings;
        return {
            id: node.id,
            label: code,
            semesters: catalogue ? semesterLabel(catalogue, node.code) : "",
            kind: node.kind,
            completed: node.completed,
            tracked: node.tracked,
            prereqUnfulfilled: node.prereqUnfulfilled ?? false,
            notOffered: catalogue ? !isOffered(catalogue, node.code) : false,
            wildcard,
        };
    }
    if (node.kind === "more") {
        const label = node.expanded ? "Show fewer" : `+${node.hiddenCount} more`;
        return { id: node.id, label, kind: node.kind, gateId: node.gateId };
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
                // Almost every prerequisite needs a D, so only unusual grades are shown.
                gradeLabel: edge.minGrade && edge.minGrade !== USUAL_MIN_GRADE ? edge.minGrade : "",
                status: edge.status,
            },
        }];
    }));

    return [
        ...Array.from(graph.nodes.values(), node => ({ data: nodeData(node, offerings) })),
        ...edges.values(),
    ];
}
