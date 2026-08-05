export const cytoscapeStyles = [
    {
        selector: 'node[kind="module"]',
        style: {
            label: "data(label)", shape: "round-rectangle", "corner-radius": 8,
            "background-color": "#6c8ebf", "text-valign": "center", "text-halign": "center",
            color: "#fff", "font-weight":"bold", width: 90, height: 36, "font-size": 14, "border-width": 0,
        } as any 
    },
    {
        selector: 'node[kind="module"][?tracked]',
        style: {"background-color":"#2c4f83",}
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
            width: 1.5, "line-color": "#4a4e5e", "target-arrow-color": "#4a4e5e",
            "target-arrow-shape": "triangle", "arrow-scale": 0.8, "curve-style": "bezier", opacity: 0.7,
        }
    },
    { selector: ".dimmed", style: { opacity: 0.15 } },
];

export const cytoscapeLayout = {
    name: "dagre", rankDir:"LR", nodeSep: 15, rankSet: 60, edgeSet: 10,
} as any;