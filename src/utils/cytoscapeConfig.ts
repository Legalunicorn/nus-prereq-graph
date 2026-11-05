import type cytoscape from "cytoscape";
import type { GraphPalette } from "./theme";

const FADE = { "transition-property": "opacity", "transition-duration": 180 };

export function buildStyles(colors: GraphPalette): cytoscape.StylesheetStyle[] {
    return [
        {
            selector: 'node[kind="module"]',
            style: {
                label: "data(label)", shape: "round-rectangle", "corner-radius": "6px",
                "background-color": colors.notPlannedFill, "text-valign": "center", "text-halign": "center",
                color: colors.notPlannedText, "font-weight": 600, "font-family": colors.mono,
                width: 86, height: 32, "font-size": 12,
                "border-width": 1, "border-color": colors.notPlannedBorder,
                ...FADE,
            }
        },
        {
            selector: 'node[kind="tag"]',
            style: {
                label: "data(label)", shape: "round-rectangle", "corner-radius": "7px",
                width: 46, height: 13, "font-size": 9, "text-valign": "center", "text-halign": "center",
                color: colors.tagText, "background-color": colors.tag, "border-width": 0,
                events: "no",
                ...FADE,
            },
        },
        {
            selector: 'node[kind="tag"][?notOffered]',
            style: { width: 58, color: colors.notOffered },
        },
        {
            selector: 'node[kind="module"][?tracked]',
            style: { "background-color": colors.ready, color: colors.onStatus, "border-width": 0 },
        },
        {
            selector: 'node[kind="module"][?tracked][?prereqUnfulfilled]',
            style: { "background-color": colors.blocked },
        },
        {
            selector: 'node[kind="module"][?completed]',
            style: { "background-color": colors.completed, color: colors.onStatus, "border-width": 0 },
        },
        {
            selector: 'node[kind="module"][?taking]',
            style: { "background-color": colors.taking, color: colors.onStatus, "border-width": 0 },
        },
        {
            selector: 'node[kind="module"][?notOffered]',
            style: { "border-width": 2, "border-style": "dashed", "border-color": colors.notOffered },
        },
        {
            selector: 'node[kind="more"]',
            style: {
                label: "data(label)", shape: "round-rectangle", "corner-radius": "12px",
                width: 66, height: 20, "font-size": 10, "text-valign": "center", "text-halign": "center",
                color: colors.notPlannedText, "background-color": colors.notPlannedFill,
                "border-width": 1, "border-color": colors.notPlannedBorder,
                ...FADE,
            },
        },
        {
            selector: 'node[kind="gate"]',
            style: {
                label: "data(label)", shape: "round-rectangle", "corner-radius": "8px",
                width: 32, height: 16, "font-size": 9, "font-weight": 700, "font-family": colors.mono,
                "text-valign": "center", "text-halign": "center",
                ...FADE,
            }
        },
        { selector: 'node[gateType="and"]', style: { shape: "hexagon", width: 40, height: 20 } },
        { selector: 'node[gateType="nOf"]', style: { shape: "cut-rectangle", width: 38, height: 18 } },
        {
            selector: 'node[kind="gate"][?fulfilled]',
            style: { "background-color": colors.fulfilled, color: colors.canvas },
        },
        {
            selector: 'node[kind="gate"][!fulfilled]',
            style: {
                "background-color": colors.canvas, color: colors.unfulfilled,
                "border-width": 1, "border-color": colors.unfulfilled,
            },
        },
        {
            selector: "edge",
            style: {
                width: 1.25, "line-color": colors.neutral, "target-arrow-color": colors.neutral,
                "target-arrow-shape": "triangle", "arrow-scale": 0.7,
                "curve-style": "unbundled-bezier", "edge-distances": "node-position", opacity: 0.8,
                ...FADE,
            }
        },
        {
            selector: 'edge[status = "fulfilled"]',
            style: { "line-color": colors.fulfilled, "target-arrow-color": colors.fulfilled, opacity: 0.9 }
        },
        {
            selector: 'edge[status = "unfulfilled"]',
            style: {
                "line-color": colors.unfulfilled, "target-arrow-color": colors.unfulfilled,
                "line-style": "dashed", "line-dash-pattern": [4, 3], opacity: 0.85,
            }
        },
        {
            selector: 'edge[gradeLabel != ""]',
            style: {
                label: "data(gradeLabel)", "font-size": 10, "font-weight": "bold", color: colors.notOffered,
                "text-background-color": colors.canvas, "text-background-opacity": 1, "text-background-padding": "2px",
            },
        },
        { selector: ".dimmed", style: { opacity: 0.15 } },
    ];
}

interface DagreLayoutOptions extends cytoscape.BaseLayoutOptions {
    name: "dagre";
    rankDir: "LR" | "TB";
    nodeSep: number;
    rankSep: number;
    edgeSep: number;
}

export type GraphDirection = "horizontal" | "vertical";

const DAGRE_LAYOUTS: Record<GraphDirection, DagreLayoutOptions> = {
    horizontal: { name: "dagre", rankDir: "LR", nodeSep: 32, rankSep: 48, edgeSep: 10 },
    vertical: { name: "dagre", rankDir: "TB", nodeSep: 14, rankSep: 72, edgeSep: 10 },
};

// The cytoscape types only list built-in layouts, so dagre needs a cast here.
export const layoutFor = (direction: GraphDirection) => DAGRE_LAYOUTS[direction] as unknown as cytoscape.LayoutOptions;
