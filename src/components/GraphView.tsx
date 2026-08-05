import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import "./GraphView.css";
import type { Mod } from "../types/types";
import { buildGraph } from "../utils/buildGraph";
import { cytoscapeStyles, cytoscapeLayout } from "../utils/cytoscapeConfig";
import { useEffect, useRef, useState } from "react";
import NodePopup from "./NodePopup";

cytoscape.use(dagre);

interface GraphViewProps {
    mods: Mod[];
    onToggle: (code: string) => void;
    onAdd: (mod: Mod) => void;
    onRemove: (code: string) => void;
}

interface PopupState { code: string; x: number; y: number; }

export default function GraphView({ mods, onToggle, onAdd, onRemove }: GraphViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<cytoscape.Core | null>(null);
    const [popup, setPopup] = useState<PopupState | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const graph = buildGraph(mods);

        const elements = [
            ...Array.from(graph.nodes.values()).map(node => {
                if (node.kind === "module") {
                    return { data: { id: node.id, label: node.code, kind: node.kind, completed: node.completed, tracked: node.tracked } };
                }
                let label = node.gateType === "and" ? "AND" : node.gateType === "or" ? "OR" : `${node.n} OF`;
                return { data: { id: node.id, label, kind: node.kind, fulfilled: node.fulfilled } };
            }),
            ...graph.edges.map(edge => ({ data: { source: edge.from, target: edge.to, minGrade: edge.minGrade ?? "" } })),
        ];

        cyRef.current?.destroy();
        const cy = cytoscape({
            container: containerRef.current,
            elements,
            style: cytoscapeStyles,
            layout: cytoscapeLayout,
        });

        cy.on("tap", 'node[kind="module"]', (evt) => {
            const node = evt.target; const pos = node.renderedPosition();
            setPopup({ code: node.id(), x: pos.x, y: pos.y });
        });
        cy.on("tap", (evt) => { if (evt.target === cy) setPopup(null); });
        cy.on("pan zoom", () => setPopup(null));
        
        cy.on("mouseover", "node", (evt) => {
            const neighborhood = evt.target.closedNeighborhood();
            cy.elements().not(neighborhood).addClass("dimmed");
        });
        cy.on("mouseout", "node", () => cy.elements().removeClass("dimmed"));

        cyRef.current = cy;
        return () => { cy.destroy(); };
    }, [mods, onToggle]);

    return (
        <div className="graph-wrapper">
            <div ref={containerRef} className="graph-container" />
            {popup && (
                <NodePopup code={popup.code} x={popup.x} y={popup.y} mods={mods} onClose={() => setPopup(null)} onAdd={onAdd} onRemove={onRemove} onToggle={onToggle} />
            )}
        </div>
    );
}