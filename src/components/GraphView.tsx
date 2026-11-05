import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import "./GraphView.css";
import type { Mod } from "../types/types";
import { createRank } from "../utils/alternatives";
import { buildGraph } from "../utils/buildGraph";
import { PHONE_WIDTH } from "../constants";
import { buildStyles } from "../utils/cytoscapeConfig";
import type { GraphDirection } from "../utils/cytoscapeConfig";
import { readGraphPalette } from "../utils/theme";
import type { Theme } from "../utils/theme";
import { toElements } from "../utils/graphElements";
import { popupPosition } from "../utils/popupPosition";
import { includeTags, moveTagWithNode } from "../utils/semesterTags";
import { syncGraph } from "../utils/syncGraph";
import { useEffect, useRef, useState } from "react";
import useOfferings from "../hooks/useOfferings";
import useSnapshot from "../hooks/useSnapshot";
import Legend from "./Legend";
import NodePopup from "./NodePopup";

cytoscape.use(dagre);

const FIT_PADDING = 30;
const MAX_ZOOM = 1.5;

interface GraphViewProps {
    mods: Mod[];
    theme: Theme;
    estimate: ((code: string) => number | null) | null;
    onToggle: (code: string) => void;
    onAdd: (mod: Mod) => void;
    onRemove: (code: string) => void;
}

interface PopupState { code: string; x: number; y: number; }

export default function GraphView({ mods, theme, estimate, onToggle, onAdd, onRemove }: GraphViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<cytoscape.Core | null>(null);
    const [popup, setPopup] = useState<PopupState | null>(null);
    const [isFullChain, setIsFullChain] = useState(false);
    const [direction, setDirection] = useState<GraphDirection>(
        () => (window.matchMedia(PHONE_WIDTH).matches ? "vertical" : "horizontal"),
    );
    const [expandedGates, setExpandedGates] = useState<ReadonlySet<string>>(new Set());
    const offerings = useOfferings();
    const snapshot = useSnapshot();

    useEffect(() => {
        const cy = cytoscape({
            container: containerRef.current,
            style: buildStyles(readGraphPalette()),
            maxZoom: MAX_ZOOM,
        });

        cy.on("tap", 'node[kind="module"][!wildcard]', (evt) => {
            const node = evt.target; const pos = node.renderedPosition();
            setPopup({ code: node.id(), ...popupPosition(pos.x, pos.y, cy.width(), cy.height()) });
        });
        cy.on("tap", 'node[kind="more"]', (evt) => {
            const gateId: string = evt.target.data("gateId");
            setExpandedGates(prev => {
                const next = new Set(prev);
                if (!next.delete(gateId)) {
                    next.add(gateId);
                }
                return next;
            });
        });
        cy.on("tap", (evt) => { if (evt.target === cy) { setPopup(null); } });
        cy.on("pan zoom layoutstop", () => setPopup(null));

        cy.on("position", 'node[kind="module"]', (evt) => moveTagWithNode(cy, evt.target));

        cy.on("mouseover", "node", (evt) => {
            const node = evt.target;
            const chain = node.predecessors().union(node.successors()).union(node);
            cy.elements().not(includeTags(cy, chain)).addClass("dimmed");
        });
        cy.on("mouseout", "node", () => cy.elements().removeClass("dimmed"));

        cyRef.current = cy;
        return () => {
            cy.destroy();
            cyRef.current = null;
        };
    }, []);

    useEffect(() => {
        cyRef.current?.style(buildStyles(readGraphPalette()));
    }, [theme]);

    useEffect(() => {
        if (!cyRef.current) {
            return;
        }
        const treeOf = isFullChain && snapshot
            ? (code: string) => snapshot.modules[code]?.prereqTree
            : undefined;
        const rank = createRank(new Set(mods.map(mod => mod.code)), offerings);
        const graph = buildGraph(mods, { treeOf, alternatives: { rank, expanded: expandedGates } });
        syncGraph(cyRef.current, toElements(graph, offerings), direction);
    }, [mods, offerings, isFullChain, snapshot, expandedGates, direction]);

    return (
        <div className="graph-wrapper">
            <div ref={containerRef} className="graph-container" />
            {mods.length === 0 && <p className="graph-empty">Search for a module to start</p>}
            {mods.length > 0 && (
                <>
                    <div className="graph-controls">
                        {snapshot && (
                            <button
                                className={isFullChain ? "active" : ""}
                                aria-pressed={isFullChain}
                                title={`Prerequisite data from ${snapshot.generatedAt}`}
                                onClick={() => setIsFullChain(prev => !prev)}
                            >
                                Full chain
                            </button>
                        )}
                        <button onClick={() => setDirection(prev => (prev === "horizontal" ? "vertical" : "horizontal"))}>
                            {direction === "horizontal" ? "Vertical" : "Horizontal"}
                        </button>
                        <button onClick={() => cyRef.current?.animate({ fit: { eles: "", padding: FIT_PADDING }, duration: 200 })}>Fit</button>
                    </div>
                    <Legend />
                </>
            )}
            {popup && (
                <NodePopup key={popup.code} code={popup.code} x={popup.x} y={popup.y} mods={mods} minSemesters={estimate?.(popup.code) ?? null} onClose={() => setPopup(null)} onAdd={onAdd} onRemove={onRemove} onToggle={onToggle} />
            )}
        </div>
    );
}
