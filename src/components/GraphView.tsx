import cytoscape from "cytoscape";
import "./GraphView.css";
import type { Mod } from "../types/types";
import { createRank } from "../utils/alternatives";
import { buildGraph } from "../utils/buildGraph";
import { buildStyles } from "../utils/cytoscapeConfig";
import { readGraphPalette } from "../utils/theme";
import type { Theme } from "../utils/theme";
import { toElements } from "../utils/graphElements";
import { applyLongestPaths } from "../utils/longestPath";
import { applyParallax } from "../utils/parallax";
import { attachChainHighlight } from "../utils/chainHighlight";
import { straighten } from "../utils/edgeRouteStyle";
import { hideCompleted } from "../utils/hideCompleted";
import { moveTagWithNode } from "../utils/semesterTags";
import { syncGraph } from "../utils/syncGraph";
import { fitAll, MAX_ZOOM, MIN_ZOOM } from "../utils/viewport";
import { useEffect, useRef, useState } from "react";
import useGraphDirection from "../hooks/useGraphDirection";
import useOfferings from "../hooks/useOfferings";
import useSnapshot from "../hooks/useSnapshot";
import GraphControls from "./GraphControls";
import Legend from "./Legend";
import ShareButton from "./ShareButton";


interface GraphViewProps {
    mods: Mod[];
    theme: Theme;
    longestPaths: string[][];
    minSemestersOf: (code: string) => number | null;
    selectedCode: string | null;
    hoveredCode: string | null;
    onSelect: (code: string | null) => void;
}

export default function GraphView({ mods, theme, longestPaths, minSemestersOf, selectedCode, hoveredCode, onSelect }: GraphViewProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<cytoscape.Core | null>(null);
    const previewChainRef = useRef<((code: string | null) => void) | null>(null);
    const [isFullChain, setIsFullChain] = useState(false);
    const [isLongestPathOn, setIsLongestPathOn] = useState(false);
    const [isHidingCompleted, setIsHidingCompleted] = useState(false);
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
        });
        // A dragged node leaves its route behind, so its edges go straight until the next layout.
        cy.on("drag", 'node[kind != "tag"]', (evt) => {
            straighten(evt.target.connectedEdges());
        });

        previewChainRef.current = attachChainHighlight(cy);

        cyRef.current = cy;
        return () => {
            cy.destroy();
            cyRef.current = null;
            previewChainRef.current = null;
        };
    }, [onSelect]);

    useEffect(() => {
        previewChainRef.current?.(hoveredCode);
    }, [hoveredCode]);

    useEffect(() => {
        cyRef.current?.style(buildStyles(readGraphPalette()));
    }, [theme]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }
        const observer = new ResizeObserver(() => cyRef.current?.resize());
        observer.observe(container);
        return () => observer.disconnect();
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
        const shown = isHidingCompleted ? hideCompleted(graph) : graph;
        syncGraph(cyRef.current, toElements(shown, offerings, minSemestersOf), direction);
        applyLongestPaths(cyRef.current, isLongestPathOn ? longestPaths : []);
    }, [mods, offerings, isFullChain, snapshot, expandedGates, direction, isLongestPathOn, isHidingCompleted, longestPaths, minSemestersOf]);

    return (
        <div ref={wrapperRef} className="graph-wrapper">
            <div ref={containerRef} className="graph-container" />
            {mods.length === 0 && <p className="graph-empty">Search for a module to start</p>}
            {mods.length > 0 && (
                <>
                    <GraphControls>
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
                        {longestPaths.length > 0 && (
                            <button
                                className={isLongestPathOn ? "active" : ""}
                                aria-pressed={isLongestPathOn}
                                title="Highlight every chain that decides the minimum semesters"
                                onClick={() => setIsLongestPathOn(prev => !prev)}
                            >
                                Longest paths
                            </button>
                        )}
                        <button
                            className={isHidingCompleted ? "active" : ""}
                            aria-pressed={isHidingCompleted}
                            onClick={() => setIsHidingCompleted(prev => !prev)}
                        >
                            Hide done
                        </button>
                        <button onClick={toggleDirection}>
                            {direction === "horizontal" ? "Vertical" : "Horizontal"}
                        </button>
                        <ShareButton mods={mods} />
                        <button onClick={() => cyRef.current && fitAll(cyRef.current)}>Fit</button>
                    </GraphControls>
                    <Legend />
                </>
            )}
        </div>
    );
}
