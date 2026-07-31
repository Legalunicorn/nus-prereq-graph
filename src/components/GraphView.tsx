import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import "./GraphView.css";
import type { Mod } from "../types/types";
import { buildGraph } from "../utils/buildGraph";
import { useEffect, useRef } from "react";

cytoscape.use(dagre);

interface GraphViewProps {
    mods: Mod[];
    onToggle: (code: string) => void;
}

export default function GraphView({ mods, onToggle }: GraphViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<cytoscape.Core | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const graph = buildGraph(mods);

        // Convert our Map/array graph into cytoscape's element format
        const elements = [
            ...Array.from(graph.nodes.values()).map(node => {
                if (node.kind === "module") {
                    return {
                        data: {
                            id: node.id,
                            label: node.code,
                            kind: node.kind,
                            completed: node.completed,
                            tracked: node.tracked,
                        }
                    };
                }
                let label;
                if (node.gateType === "and") {
                    label = "AND";
                } else if (node.gateType === "or") {
                    label = "OR";
                } else {
                    label = `${node.n} OF`;
                }
                return {
                    data: {
                        id: node.id,
                        label,
                        kind: node.kind,
                        fulfilled: node.fulfilled,
                    }
                };
            }),
            ...graph.edges.map(edge => ({
                data: {
                    source: edge.from,
                    target: edge.to,
                    minGrade: edge.minGrade ?? "",
                }
            })),
        ];

        // Destroy any previous instance before creating a new one,
        // otherwise you get duplicate canvases stacking up on every re-render.
        cyRef.current?.destroy();

        const cy = cytoscape({
            container: containerRef.current,
            elements,
            style: [
                {
                    selector: 'node[kind="module"]',
                    style: {
                        label: "data(label)",
                        shape: "round-rectangle",
                        "background-color": "#6c8ebf",
                        "text-valign": "center",
                        "text-halign": "center",
                        color: "#fff",
                        "font-weight":"bold",
                        width: 90,
                        height: 36,
                        "font-size": 11,
                        "border-width": 0,
                    }
                },
                {
                    // completed modules get a different color
                    selector: 'node[kind="module"][?completed]',
                    style: { "background-color": "#658f4d" }
                },
                {
                    // mods the user actually added via the sidebar get a distinct border
                    selector: 'node[kind="module"][?tracked]',
                    style: {
                        "border-width": 5,
                        "border-color": "#e7eff8",
                        "border-style": "solid",
                    }
                },
                {
                    selector: 'node[kind="gate"]',
                    style: {
                        label: "data(label)",
                        width: 20,
                        height: 20,
                        "background-color": "#999",
                        shape: "diamond",
                        "font-size": 9,
                        color: "#e0dbdb",
                        "text-valign": "top",
                        "text-margin-y": -6,
                    }
                },
                {
                    // gate condition already satisfied by tracked/completed mods
                    selector: 'node[kind="gate"][?fulfilled]',
                    style: { "background-color": "#82b366" }
                },
                {
                    selector: "edge",
                    style: {
                        width: 2,
                        "line-color": "#ccc",
                        "target-arrow-color": "#ccc",
                        "target-arrow-shape": "triangle",
                        "curve-style": "bezier",
                    }
                }
            ],
            layout: {
                name: "dagre",
                rankDir:"LR",
                nodeSep: 15,
                rankSet: 60,
                edgeSet: 10,
            } as any,
        });

        // clic a module node toggles its completed status.
        // Gate nodes aren't clickable/toggleable - they're not real mods.
        cy.on("tap", 'node[kind="module"]', (evt) => {
            onToggle(evt.target.id());
        });

        cyRef.current = cy;

        return () => {
            cy.destroy();
        };
    }, [mods, onToggle]);

    return <div ref={containerRef} className="graph-container" />;
}