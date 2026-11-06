import type { Graph, Node } from "../types/graph";
import { isWildcard } from "./prereqTree";
import { isOffered, semesterLabel } from "./offerings";
import type { Offerings } from "./offerings";

type MinSemestersOf = (code: string) => number | null;

const USUAL_MIN_GRADE = "D";

function gateLabel(node: Extract<Node, { kind: "gate" }>): string {
    if (node.gateType === "and") {
        return "AND";
    }
    if (node.gateType === "or") {
        return "OR";
    }
    return `${node.n} OF`;
}

/** Joins a module's semesters and how many semesters it takes at minimum, leaving out whichever is empty. */
export function tagLabel(semesters: string, minSemesters: number | null): string {
    const estimate = minSemesters ? `${minSemesters} sem` : "";
    return [semesters, estimate].filter(Boolean).join(" · ");
}

function nodeData(node: Node, offerings: Offerings | null, minSemestersOf: MinSemestersOf) {
    if (node.kind === "module") {
        const wildcard = isWildcard(node.code);
        const displayCode = wildcard ? node.code.replaceAll("%", "*") : node.code;
        const mark = node.taking ? "◐ " : node.completed ? "✓ " : "";
        const code = `${mark}${displayCode}`;
        const catalogue = wildcard ? null : offerings;
        return {
            id: node.id,
            label: code,
            tag: tagLabel(catalogue ? semesterLabel(catalogue, node.code) : "", wildcard ? null : minSemestersOf(node.code)),
            kind: node.kind,
            completed: node.completed,
            taking: node.taking ?? false,
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
    return { id: node.id, label: gateLabel(node), kind: node.kind, gateType: node.gateType, fulfilled: node.fulfilled };
}

export function toElements(graph: Graph, offerings: Offerings | null = null, minSemestersOf: MinSemestersOf = () => null) {
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
        ...Array.from(graph.nodes.values(), node => ({ data: nodeData(node, offerings, minSemestersOf) })),
        ...edges.values(),
    ];
}
