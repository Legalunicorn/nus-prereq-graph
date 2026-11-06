import type cytoscape from "cytoscape";
import { shade } from "../utils/theme";
import type { GraphPalette } from "../utils/theme";

/** Cytoscape has no drop shadow, so depth comes from a lit fill, a lighter edge and a faint halo. */
const raised = (fill: string, border = shade(fill, 0.28)) => ({
    "background-fill": "linear-gradient" as const,
    "background-gradient-stop-colors": `${shade(fill, 0.14)} ${shade(fill, -0.1)}`,
    "background-gradient-stop-positions": "0% 100%",
    "background-gradient-direction": "to-bottom" as const,
    "border-width": 1, "border-color": border,
    "underlay-color": fill, "underlay-padding": 3, "underlay-opacity": 0.2, "underlay-shape": "round-rectangle" as const,
});

export function buildStyles(colors: GraphPalette): cytoscape.StylesheetStyle[] {
    return [
        {
            selector: 'node[kind="module"]',
            style: {
                label: "data(label)", shape: "round-rectangle", "corner-radius": "8px", "min-zoomed-font-size": 5,
                "text-valign": "center", "text-halign": "center",
                color: colors.notPlannedText, "font-weight": 600, "font-family": colors.mono,
                width: 86, height: 32, "font-size": 12,
                ...raised(colors.notPlannedFill, colors.notPlannedBorder),
                "underlay-color": colors.notPlannedBorder, "underlay-opacity": 0.12,
            }
        },
        {
            selector: 'node[kind="tag"]',
            style: {
                label: "data(label)", shape: "round-rectangle", "corner-radius": "7px",
                width: "data(width)", height: 13, "font-size": 9, "text-valign": "center", "text-halign": "center",
                color: colors.tagText, "background-color": colors.tag, "border-width": 0,
                events: "no",
            },
        },
        {
            selector: 'node[kind="tag"][?notOffered]',
            style: { color: colors.notOffered },
        },
        {
            selector: 'node[kind="module"][?tracked]',
            style: { ...raised(colors.ready), color: colors.onStatus },
        },
        {
            selector: 'node[kind="module"][?tracked][?prereqUnfulfilled]',
            style: raised(colors.blocked),
        },
        {
            selector: 'node[kind="module"][?completed]',
            style: { ...raised(colors.completed), color: colors.onStatus },
        },
        {
            selector: 'node[kind="module"][?taking]',
            style: { ...raised(colors.taking), color: colors.onStatus },
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
            },
        },
        {
            selector: 'node[kind="gate"]',
            style: {
                label: "data(label)", shape: "round-rectangle", "corner-radius": "8px",
                width: 32, height: 16, "font-size": 9, "font-weight": 700, "font-family": colors.mono,
                "text-valign": "center", "text-halign": "center",
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
                "curve-style": "straight", "edge-distances": "node-position", opacity: 0.8,
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
        {
            selector: 'node[kind="module"]:selected',
            style: { "border-width": 2, "border-style": "solid", "border-color": colors.gateText },
        },
        {
            selector: "node.longest",
            style: {
                "border-width": 2, "border-style": "solid", "border-color": colors.accent,
                "underlay-color": colors.accent, "underlay-padding": 5, "underlay-opacity": 0.3,
            },
        },
        {
            selector: "edge.longest",
            style: {
                width: 3, "line-color": colors.accent, "target-arrow-color": colors.accent, opacity: 1,
                "line-style": "dashed", "line-dash-pattern": [10, 6],
                "underlay-color": colors.accent, "underlay-padding": 3, "underlay-opacity": 0.2,
            },
        },
        { selector: ".off-path", style: { opacity: 0.2 } },
        { selector: ".dimmed", style: { opacity: 0.15 } },
    ];
}

export type GraphDirection = "horizontal" | "vertical";
