import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import "./GraphView.css";
import type { Mod } from "../types/types";
import { createRank } from "../utils/alternatives";
import { buildGraph } from "../utils/buildGraph";
import { buildStyles } from "../utils/cytoscapeConfig";
import { readGraphPalette } from "../utils/theme";
import type { Theme } from "../utils/theme";
import { toElements } from "../utils/graphElements";
import { applyLongestPath } from "../utils/longestPath";
import { applyParallax } from "../utils/parallax";
import { attachChainHighlight } from "../utils/chainHighlight";
import { applyEdgeCurves } from "../utils/edgeCurves";
import { moveTagWithNode } from "../utils/semesterTags";
import { rewrapOnResize, syncGraph } from "../utils/syncGraph";
import { useEffect, useRef, useState } from "react";
import useGraphDirection from "../hooks/useGraphDirection";
import useOfferings from "../hooks/useOfferings";
import useSnapshot from "../hooks/useSnapshot";
import Legend from "./Legend";
import ShareButton from "./ShareButton";

cytoscape.use(dagre);

const FIT_PADDING = 30;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 1.25;
const RESIZE_DELAY = 150;

interface GraphViewProps {
    mods: Mod[];
    theme: Theme;
    longestPath: string[];
    selectedCode: string | null;
    onSelect: (code: string | null) => void;
}

export default function GraphView({ mods, theme, longestPath, selectedCode, onSelect }: GraphViewProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<cytoscape.Core | null>(null);
    const [isFullChain, setIsFullChain] = useState(false);
    const [isLongestPathOn, setIsLongestPathOn] = useState(false);
    const { direction, toggleDirection } = useGraphDirection();
    const [expandedGates, setExpandedGates] = useState<ReadonlySet<string>>(new Set());
    const offerings = useOfferings();
    const snapshot = useSnapshot();

    useEffect(() => {
        const cy = cytoscape({
            container: containerRef.current,
            style: buildStyles(readGraphPalette()),
            minZoom: MIN_ZOOM,
            maxZoom: MAX_ZOOM,
        });

        cy.on("tap", 'node[kind="module"][!wildcard]', (evt) => {
            onSelect(evt.target.id());
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
        cy.on("tap", (evt) => {
            if (evt.target === cy) {
                onSelect(null);
            }
        });
        cy.on("pan", () => {
            if (wrapperRef.current) {
                applyParallax(wrapperRef.current, cy.pan());
            }
        });

        cy.on("position", 'node[kind != "tag"]', (evt) => {
            moveTagWithNode(cy, evt.target);
            applyEdgeCurves(cy, evt.target.connectedEdges());
        });

        attachChainHighlight(cy);

        cyRef.current = cy;
        return () => {
            cy.destroy();
            cyRef.current = null;
        };
    }, [onSelect]);

    useEffect(() => {
        cyRef.current?.style(buildStyles(readGraphPalette()));
    }, [theme]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }
        let timer: number | undefined;
        const observer = new ResizeObserver(() => {
            window.clearTimeout(timer);
            timer = window.setTimeout(() => {
                if (cyRef.current) {
                    rewrapOnResize(cyRef.current);
                }
            }, RESIZE_DELAY);
        });
        observer.observe(container);
        return () => {
            window.clearTimeout(timer);
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        const cy = cyRef.current;
        if (!cy) {
            return;
        }
        cy.nodes(":selected").unselect();
        const node = selectedCode ? cy.getElementById(selectedCode) : null;
        if (!node || node.empty()) {
            return;
        }
        node.select();
        const { x, y } = node.renderedPosition();
        if (x < 0 || y < 0 || x > cy.width() || y > cy.height()) {
            cy.animate({ center: { eles: node }, duration: 200 });
        }
    }, [selectedCode]);

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
        applyLongestPath(cyRef.current, isLongestPathOn ? longestPath : []);
    }, [mods, offerings, isFullChain, snapshot, expandedGates, direction, isLongestPathOn, longestPath]);

    return (
        <div ref={wrapperRef} className="graph-wrapper">
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
                        {longestPath.length > 0 && (
                            <button
                                className={isLongestPathOn ? "active" : ""}
                                aria-pressed={isLongestPathOn}
                                title="Highlight the chain that decides the minimum semesters"
                                onClick={() => setIsLongestPathOn(prev => !prev)}
                            >
                                Longest path
                            </button>
                        )}
                        <button onClick={toggleDirection}>
                            {direction === "horizontal" ? "Vertical" : "Horizontal"}
                        </button>
                        <ShareButton mods={mods} />
                        <button onClick={() => cyRef.current?.animate({ fit: { eles: "", padding: FIT_PADDING }, duration: 200 })}>Fit</button>
                    </div>
                    <Legend />
                </>
            )}
        </div>
    );
}
