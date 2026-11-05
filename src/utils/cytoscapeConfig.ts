import type cytoscape from "cytoscape";

// Graph colours. Cytoscape draws on a canvas, so it can't use the CSS variables in index.css.
// Legend.css repeats the node and edge colours.
const COLORS = {
    notPlannedFill: "#232638",
    notPlannedBorder: "#5a6078",
    notPlannedText: "#b7bcd0",
    ready: "#2f6bd6",
    blocked: "#b3453c",
    completed: "#3f7d4a",
    notOffered: "#e0a458",
    fulfilled: "#7fb069",
    unfulfilled: "#d0635a",
    neutral: "#5a6078",
};

export const cytoscapeStyles: cytoscape.StylesheetStyle[] = [
    {
        selector: 'node[kind="module"]',
        style: {
            label: "data(label)", shape: "round-rectangle", "corner-radius": "8px",
            "background-color": COLORS.notPlannedFill, "text-valign": "center", "text-halign": "center",
            color: COLORS.notPlannedText, "font-weight": "bold", width: 90, height: 44, "font-size": 13,
            "border-width": 1, "border-color": COLORS.notPlannedBorder,
            "text-wrap": "wrap",
        }
    },
    {
        selector: 'node[kind="module"][?tracked]',
        style: { "background-color": COLORS.ready, color: "#fff", "border-width": 0 },
    },
    {
        selector: 'node[kind="module"][?tracked][?prereqUnfulfilled]',
        style: { "background-color": COLORS.blocked },
    },
    {
        selector: 'node[kind="module"][?completed]',
        style: { "background-color": COLORS.completed, color: "#fff", "border-width": 0 },
    },
    {
        selector: 'node[kind="module"][?notOffered]',
        style: { "border-width": 2, "border-style": "dashed", "border-color": COLORS.notOffered },
    },

    {
        selector: 'node[kind="more"]',
        style: {
            label: "data(label)", shape: "round-rectangle", "corner-radius": "12px",
            width: 76, height: 24, "font-size": 11, "text-valign": "center", "text-halign": "center",
            color: COLORS.notPlannedText, "background-color": COLORS.notPlannedFill,
            "border-width": 1, "border-color": COLORS.notPlannedBorder,
        },
    },
    {
        selector: 'node[kind="gate"]',
        style: {
            label: "data(label)", width: 20, height: 20,
            shape: "diamond", "font-size": 10, color: "#e0dbdb", "text-valign": "top", "text-margin-y": -2,
        }
    },
    { selector: 'node[kind="gate"][?fulfilled]', style: { "background-color": COLORS.fulfilled } },
    { selector: 'node[kind="gate"][!fulfilled]', style: { "background-color": COLORS.unfulfilled } },
    {
        selector: "edge",
        style: {
            width: 1.8, "line-color": COLORS.neutral, "target-arrow-color": COLORS.neutral,
            "target-arrow-shape": "triangle", "arrow-scale": 0.8, "curve-style": "bezier", opacity: 0.8,
        }
    },
    {
        selector: 'edge[status = "fulfilled"]',
        style: { "line-color": COLORS.fulfilled, "target-arrow-color": COLORS.fulfilled, opacity: 0.9 }
    },
    {
        selector: 'edge[status = "unfulfilled"]',
        style: {
            "line-color": COLORS.unfulfilled, "target-arrow-color": COLORS.unfulfilled,
            "line-style": "dashed", opacity: 0.85,
        }
    },
    { selector: ".dimmed", style: { opacity: 0.15 } },
];

interface DagreLayoutOptions extends cytoscape.BaseLayoutOptions {
    name: "dagre";
    rankDir: "LR" | "TB";
    nodeSep: number;
    rankSep: number;
    edgeSep: number;
}

const dagreLayout: DagreLayoutOptions = {
    name: "dagre", rankDir: "LR", nodeSep: 15, rankSep: 60, edgeSep: 10,
};

// The cytoscape types only list built-in layouts, so dagre needs a cast here.
export const cytoscapeLayout = dagreLayout as unknown as cytoscape.LayoutOptions;
