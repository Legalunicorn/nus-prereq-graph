import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import "./GraphView.css";
import type { Mod } from "../types/types";
import { buildGraph } from "../utils/buildGraph";
import { cytoscapeStyles, cytoscapeLayout } from "../utils/cytoscapeConfig";
import { toElements } from "../utils/graphElements";
import { useEffect, useRef, useState } from "react";
import useOfferings from "../hooks/useOfferings";
import Legend from "./Legend";
import NodePopup from "./NodePopup";

cytoscape.use(dagre);

const FIT_PADDING = 30;
const MAX_ZOOM = 1.5; // stops small graphs from rendering oversized nodes

interface GraphViewProps {
    mods: Mod[];
    onToggle: (code: string) => void;
    onAdd: (mod: Mod) => void;
    onRemove: (code: string) => void;
}

interface PopupState { code: string; x: number; y: number; }

/** Updates what's on screen. The layout, and so the view, only changes if elements were added or removed. */
function syncElements(cy: cytoscape.Core, elements: ReturnType<typeof toElements>) {
    const currentIds = new Set(cy.elements().map(element => element.id()));
    const sameStructure = elements.length === currentIds.size
        && elements.every(element => currentIds.has(element.data.id));

    if (sameStructure) {
        cy.batch(() => {
            for (const { data } of elements) cy.getElementById(data.id).data(data);
        });
        return;
    }

    cy.elements().remove();
    cy.add(elements);
    cy.layout(cytoscapeLayout).run();
}

export default function GraphView({ mods, onToggle, onAdd, onRemove }: GraphViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<cytoscape.Core | null>(null);
    const [popup, setPopup] = useState<PopupState | null>(null);
    const offerings = useOfferings();

    useEffect(() => {
        const cy = cytoscape({
            container: containerRef.current,
            style: cytoscapeStyles,
            maxZoom: MAX_ZOOM,
        });

        cy.on("tap", 'node[kind="module"]', (evt) => {
            const node = evt.target; const pos = node.renderedPosition();
            setPopup({ code: node.id(), x: pos.x, y: pos.y });
        });
        cy.on("tap", (evt) => { if (evt.target === cy) setPopup(null); });
        cy.on("pan zoom layoutstop", () => setPopup(null));

        cy.on("mouseover", "node", (evt) => {
            const neighborhood = evt.target.closedNeighborhood();
            cy.elements().not(neighborhood).addClass("dimmed");
        });
        cy.on("mouseout", "node", () => cy.elements().removeClass("dimmed"));

        cyRef.current = cy;
        return () => {
            cy.destroy();
            cyRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (cyRef.current) syncElements(cyRef.current, toElements(buildGraph(mods), offerings));
    }, [mods, offerings]);

    return (
        <div className="graph-wrapper">
            <div ref={containerRef} className="graph-container" />
            {mods.length > 0 && (
                <>
                    <button className="graph-fit" onClick={() => cyRef.current?.fit(undefined, FIT_PADDING)}>
                        Fit
                    </button>
                    <Legend />
                </>
            )}
            {popup && (
                <NodePopup key={popup.code} code={popup.code} x={popup.x} y={popup.y} mods={mods} onClose={() => setPopup(null)} onAdd={onAdd} onRemove={onRemove} onToggle={onToggle} />
            )}
        </div>
    );
}
