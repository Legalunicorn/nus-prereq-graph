import type { Graph } from "../types/graph";
import { pruneUnreachable } from "./walkTree";

/** Removes completed modules, and the gates they satisfied, keeping whatever still affects planning. */
export function hideCompleted(graph: Graph): Graph {
    const inputsOf = (id: string) => graph.edges.filter(edge => edge.to === id).map(edge => edge.from);

    const dependsOnTaking = (id: string): boolean => {
        const node = graph.nodes.get(id);
        return (node?.kind === "module" && !!node.taking) || inputsOf(id).some(dependsOnTaking);
    };

    const isHidden = (id: string): boolean => {
        const node = graph.nodes.get(id);
        if (node?.kind === "module") {
            return node.completed && !node.taking;
        }
        if (node?.kind !== "gate") {
            return false;
        }
        return node.fulfilled ? !dependsOnTaking(id) : inputsOf(id).every(isHidden);
    };

    const nodes = new Map([...graph.nodes].filter(([id]) => !isHidden(id)));
    const result: Graph = { nodes, edges: graph.edges.filter(edge => nodes.has(edge.from) && nodes.has(edge.to)) };
    pruneUnreachable(result);
    return result;
}
