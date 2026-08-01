// import cytoscape from "cytoscape";
// import dagre from "cytoscape-dagre";
// import "./GraphView.css";
// import type { Mod } from "../types/types";
// import { buildGraph } from "../utils/buildGraph";
// import { useEffect, useRef } from "react";

// cytoscape.use(dagre);

// interface GraphViewProps {
//     mods: Mod[];
//     onToggle: (code: string) => void;
// }

// export default function GraphView({ mods, onToggle }: GraphViewProps) {
//     const containerRef = useRef<HTMLDivElement>(null);
//     const cyRef = useRef<cytoscape.Core | null>(null);

//     useEffect(() => {
//         if (!containerRef.current) return;

//         const graph = buildGraph(mods);

//         // Convert our Map/array graph into cytoscape's element format
//         const elements = [
//             ...Array.from(graph.nodes.values()).map(node => {
//                 if (node.kind === "module") {
//                     return {
//                         data: {
//                             id: node.id,
//                             label: node.code,
//                             kind: node.kind,
//                             completed: node.completed,
//                             tracked: node.tracked,
//                         }
//                     };
//                 }
//                 let label;
//                 if (node.gateType === "and") {
//                     label = "AND";
//                 } else if (node.gateType === "or") {
//                     label = "OR";
//                 } else {
//                     label = `${node.n} OF`;
//                 }
//                 return {
//                     data: {
//                         id: node.id,
//                         label,
//                         kind: node.kind,
//                         fulfilled: node.fulfilled,
//                     }
//                 };
//             }),
//             ...graph.edges.map(edge => ({
//                 data: {
//                     source: edge.from,
//                     target: edge.to,
//                     minGrade: edge.minGrade ?? "",
//                 }
//             })),
//         ];

//         // Destroy any previous instance before creating a new one,
//         // otherwise you get duplicate canvases stacking up on every re-render.
//         cyRef.current?.destroy();

//         const cy = cytoscape({
//             container: containerRef.current,
//             elements,
//             style: [
//                 {
//                     selector: 'node[kind="module"]',
//                     style: {
//                         label: "data(label)",
//                         shape: "round-rectangle",
//                         "background-color": "#6c8ebf",
//                         "text-valign": "center",
//                         "text-halign": "center",
//                         color: "#fff",
//                         "font-weight":"bold",
//                         width: 90,
//                         height: 36,
//                         "font-size": 11,
//                         "border-width": 0,
//                     }
//                 },
//                 {
//                     // completed modules get a different color
//                     selector: 'node[kind="module"][?completed]',
//                     style: { "background-color": "#658f4d" }
//                 },
//                 {
//                     // mods the user actually added via the sidebar get a distinct border
//                     selector: 'node[kind="module"][?tracked]',
//                     style: {
//                         "border-width": 5,
//                         "border-color": "#e7eff8",
//                         "border-style": "solid",
//                     }
//                 },
//                 {
//                     selector: 'node[kind="gate"]',
//                     style: {
//                         label: "data(label)",
//                         width: 20,
//                         height: 20,
//                         "background-color": "#999",
//                         shape: "diamond",
//                         "font-size": 9,
//                         color: "#e0dbdb",
//                         "text-valign": "top",
//                         "text-margin-y": -6,
//                     }
//                 },
//                 {
//                     // gate condition already satisfied by tracked/completed mods
//                     selector: 'node[kind="gate"][?fulfilled]',
//                     style: { "background-color": "#82b366" }
//                 },
//                 {
//                     selector: "edge",
//                     style: {
//                         width: 2,
//                         "line-color": "#ccc",
//                         "target-arrow-color": "#ccc",
//                         "target-arrow-shape": "triangle",
//                         "curve-style": "bezier",
//                     }
//                 }
//             ],
//             layout: {
//                 name: "dagre",
//                 rankDir:"LR",
//                 nodeSep: 15,
//                 rankSet: 60,
//                 edgeSet: 10,
//             } as any,
//         });

//         // clic a module node toggles its completed status.
//         // Gate nodes aren't clickable/toggleable - they're not real mods.
//         cy.on("tap", 'node[kind="module"]', (evt) => {
//             onToggle(evt.target.id());
//         });

//         cyRef.current = cy;

//         return () => {
//             cy.destroy();
//         };
//     }, [mods, onToggle]);
//     return <div ref={containerRef} className="graph-container" />;
// }

import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import "./GraphView.css";
import type { Mod } from "../types/types";
import { buildGraph } from "../utils/buildGraph";
import { fetchMod } from "../utils/api";
import { useEffect, useRef, useState } from "react";

cytoscape.use(dagre);

interface GraphViewProps {
    mods: Mod[];
    onToggle: (code: string) => void;
    onAdd: (mod: Mod) => void;
    onRemove: (code: string) => void;
}

interface PopupState {
    code: string;
    x: number;
    y: number;
}

export default function GraphView({ mods, onToggle, onAdd, onRemove }: GraphViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<cytoscape.Core | null>(null);
    const [popup, setPopup] = useState<PopupState | null>(null);

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

        // Tapping a module node opens the popup, anchored at the node's
        // on-screen position within the container.
        cy.on("tap", 'node[kind="module"]', (evt) => {
            const node = evt.target;
            const pos = node.renderedPosition();
            setPopup({ code: node.id(), x: pos.x, y: pos.y });
        });

        // Tapping empty background closes the popup.
        cy.on("tap", (evt) => {
            if (evt.target === cy) {
                setPopup(null);
            }
        });

        // Panning/zooming would leave the popup pointing at the wrong spot, so close it.
        cy.on("pan zoom", () => {
            setPopup(null);
        });

        cyRef.current = cy;

        return () => {
            cy.destroy();
        };
    }, [mods, onToggle]);

    return (
        <div className="graph-wrapper">
            <div ref={containerRef} className="graph-container" />
            {popup && (
                <NodePopup
                    code={popup.code}
                    x={popup.x}
                    y={popup.y}
                    mods={mods}
                    onClose={() => setPopup(null)}
                    onAdd={onAdd}
                    onRemove={onRemove}
                    onToggle={onToggle}
                />
            )}
        </div>
    );
}

interface NodePopupProps {
    code: string;
    x: number;
    y: number;
    mods: Mod[];
    onClose: () => void;
    onAdd: (mod: Mod) => void;
    onRemove: (code: string) => void;
    onToggle: (code: string) => void;
}

function NodePopup({ code, x, y, mods, onClose, onAdd, onRemove, onToggle }: NodePopupProps) {
    const [loading, setLoading] = useState(false);
    const existing = mods.find(m => m.code === code);
    const tracked = !!existing;
    const completed = existing?.completed ?? false;

    const handleAddRemove = async () => {
        if (tracked) {
            onRemove(code);
            return;
        }
        setLoading(true);
        try {
            const mod = await fetchMod(code);
            onAdd(mod);
        } catch {
            // silently ignore - mod code likely invalid/not found
        } finally {
            setLoading(false);
        }
    };

    const handleToggleComplete = async () => {
        if (tracked) {
            onToggle(code);
            return;
        }
        // not tracked yet - fetch and add it as completed in one go
        setLoading(true);
        try {
            const mod = await fetchMod(code);
            onAdd({ ...mod, completed: true });
        } catch {
            // silently ignore
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="node-popup" style={{ left: x, top: y }}>
            <div className="node-popup-header">
                <span>{code}</span>
                <button className="node-popup-close" onClick={onClose}>✕</button>
            </div>

            <label className="node-popup-row">
                <input
                    type="checkbox"
                    checked={completed}
                    onChange={handleToggleComplete}
                    disabled={loading}
                />
                Completed
            </label>

            <button className="node-popup-btn" onClick={handleAddRemove} disabled={loading}>
                {tracked ? "Remove from list" : loading ? "..." : "Add to list"}
            </button>

            <a
                className="node-popup-link"
                href={`https://nusmods.com/courses/${code}`}
                target="_blank"
                rel="noreferrer"
            >
                View on NUSMods ↗
            </a>
        </div>
    );
}