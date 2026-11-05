import type cytoscape from "cytoscape";
import type { GraphDirection } from "./cytoscapeConfig";

const FIRST_TRACK = 25;
const LAST_TRACK = 80;

export interface TrackTarget {
    id: string;
    /** Position along the graph's direction: targets in the same column share this. */
    column: number;
    /** Position across the graph's direction, used to keep tracks in a stable order. */
    cross: number;
}

/**
 * Gives each target in a column its own bend position, as a percentage of the edge's length.
 * Edges only share a line when they lead to the same target.
 */
export function assignTracks(targets: TrackTarget[]): Map<string, number> {
    const columns = new Map<number, TrackTarget[]>();
    for (const target of targets) {
        const key = Math.round(target.column);
        columns.set(key, [...(columns.get(key) ?? []), target]);
    }

    const tracks = new Map<string, number>();
    for (const column of columns.values()) {
        const sorted = [...column].sort((a, b) => a.cross - b.cross);
        const step = (LAST_TRACK - FIRST_TRACK) / sorted.length;
        sorted.forEach((target, index) => {
            tracks.set(target.id, Math.round(FIRST_TRACK + step * (index + 0.5)));
        });
    }
    return tracks;
}

export function applyEdgeTracks(cy: cytoscape.Core, direction: GraphDirection) {
    const isHorizontal = direction === "horizontal";
    const targets = cy.edges().targets().map(node => ({
        id: node.id(),
        column: node.position(isHorizontal ? "x" : "y"),
        cross: node.position(isHorizontal ? "y" : "x"),
    }));
    const tracks = assignTracks(targets);
    cy.edges().forEach(edge => {
        edge.style({
            "taxi-direction": isHorizontal ? "rightward" : "downward",
            "taxi-turn": `${tracks.get(edge.target().id())}%`,
        });
    });
}
