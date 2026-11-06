import type cytoscape from "cytoscape";
import type { GraphDirection } from "./cytoscapeConfig";
import { withoutTags } from "./semesterTags";

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 3;

const MAX_FIT_ZOOM = 1.25;
const READABLE_ZOOM = 0.6;
const FIT_PADDING = 30;
const START_PADDING = 56;
const FIT_DURATION = 200;

interface Size { w: number; h: number; }

/** The zoom that fits a graph on screen. A small graph stops at a comfortable size instead of filling it. */
export function fitZoom(graph: Size, view: Size, padding = FIT_PADDING) {
    const widthZoom = graph.w > 0 ? (view.w - 2 * padding) / graph.w : MAX_FIT_ZOOM;
    const heightZoom = graph.h > 0 ? (view.h - 2 * padding) / graph.h : MAX_FIT_ZOOM;
    return Math.min(MAX_FIT_ZOOM, widthZoom, heightZoom);
}

const fitZoomFor = (cy: cytoscape.Core) => fitZoom(withoutTags(cy).boundingBox(), { w: cy.width(), h: cy.height() });

/** Fits the graph, unless that makes it too small to read. Then it opens at the start of its chain. */
export function openView(cy: cytoscape.Core, direction: GraphDirection) {
    const elements = withoutTags(cy);
    const zoom = fitZoomFor(cy);
    if (zoom >= READABLE_ZOOM) {
        cy.zoom(zoom);
        cy.center(elements);
        return;
    }
    const box = elements.boundingBox();
    cy.zoom(READABLE_ZOOM);
    cy.pan(direction === "vertical"
        ? { x: (cy.width() - box.w * READABLE_ZOOM) / 2 - box.x1 * READABLE_ZOOM, y: START_PADDING - box.y1 * READABLE_ZOOM }
        : { x: START_PADDING - box.x1 * READABLE_ZOOM, y: (cy.height() - box.h * READABLE_ZOOM) / 2 - box.y1 * READABLE_ZOOM });
}

export const fitAll = (cy: cytoscape.Core) =>
    cy.animate({ zoom: fitZoomFor(cy), center: { eles: withoutTags(cy) }, duration: FIT_DURATION });
