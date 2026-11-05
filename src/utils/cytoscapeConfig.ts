import type cytoscape from "cytoscape";

export const cytoscapeStyles: cytoscape.StylesheetStyle[] = [
    {
        selector: 'node[kind="module"]',
        style: {
            label: "data(label)", shape: "round-rectangle", "corner-radius": "8px",
            "background-color": "#6c8ebf", "text-valign": "center", "text-halign": "center",
            color: "#fff", "font-weight":"bold", width: 90, height: 44, "font-size": 13, "border-width": 0,
            "text-wrap": "wrap",
        }
    },
    {
        selector: 'node[kind="module"][?notOffered]',
        style: { "border-width": 2, "border-style": "dashed", "border-color": "#e0a458" },
    },
    {
        selector: 'node[kind="module"][?tracked]',
        style: {"background-color":"#2c4f83",}
    },
    {
        selector: 'node[kind="module"][?tracked][?prereqUnfulfilled]',
        style: { "background-color": "#82424a" },
    },
    { selector: 'node[kind="module"][?completed]', style: { "background-color": "#658f4d" } },

    {
        selector: 'node[kind="gate"]',
        style: {
            label: "data(label)", width: 20, height: 20, "background-color": "#999",
            shape: "diamond", "font-size": 10, color: "#e0dbdb", "text-valign": "top", "text-margin-y": -2,
        }
    },
    { selector: 'node[kind="gate"][?fulfilled]', style: { "background-color": "#82b366" } },
    { selector: 'node[kind="gate"][!fulfilled]', style: { "background-color": "#c0524a" } },
    {
        selector: "edge",
        style: {
            width: 1.8, "line-color": "#4a4e5e", "target-arrow-color": "#4a4e5e",
            "target-arrow-shape": "triangle", "arrow-scale": 0.8, "curve-style": "bezier", opacity: 0.7,
        }
    },
    {
        selector: 'edge[status = "fulfilled"]',
        style: { "line-color": "#82b366", "target-arrow-color": "#82b366", opacity: 0.9 }
    },
    {
        selector: 'edge[status = "unfulfilled"]',
        style: { "line-color": "#c0524a", "target-arrow-color": "#c0524a", opacity: 0.85 }
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
