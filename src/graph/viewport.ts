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

const PIXELS_PER_LINE = 33;
const PIXELS_PER_PAGE = 800;
const MAX_WHEEL_PIXELS = 120;
const ZOOM_PER_PIXEL = 0.001;
const ZOOM_PER_PINCH_PIXEL = 0.01;
const WHEEL_SETTLE_MS = 150;

interface WheelInput { deltaY: number; deltaMode: number; ctrlKey: boolean; }

/** How much one wheel event scales the zoom. A trackpad pinch arrives as a wheel event with ctrlKey set. */
export function wheelZoomFactor({ deltaY, deltaMode, ctrlKey }: WheelInput) {
    const unit = deltaMode === 1 ? PIXELS_PER_LINE : deltaMode === 2 ? PIXELS_PER_PAGE : 1;
    const pixels = Math.max(-MAX_WHEEL_PIXELS, Math.min(MAX_WHEEL_PIXELS, deltaY * unit));
    return Math.exp(-pixels * (ctrlKey ? ZOOM_PER_PINCH_PIXEL : ZOOM_PER_PIXEL));
}

/**
 * Replaces Cytoscape's wheel zoom, which guesses the input device from the first few events
 * and can stay about 30 times too fast for the rest of the page's life.
 * Listening on the parent during capture stops the event before Cytoscape sees it.
 */
export function attachWheelZoom(cy: cytoscape.Core) {
    const container = cy.container();
    const parent = container?.parentElement;
    if (!container || !parent) {
        return () => {};
    }
    // Cytoscape only draws from its cached texture while this private flag is set, as its own handler does.
    const rendererData = (cy as unknown as { renderer(): { data: { wheelZooming: boolean } } }).renderer().data;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    const onWheel = (event: WheelEvent) => {
        if (!container.contains(event.target as Node)) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        rendererData.wheelZooming = true;
        clearTimeout(settleTimer);
        settleTimer = setTimeout(() => {
            rendererData.wheelZooming = false;
            cy.forceRender();
        }, WHEEL_SETTLE_MS);
        const { left, top } = container.getBoundingClientRect();
        cy.zoom({
            level: cy.zoom() * wheelZoomFactor(event),
            renderedPosition: { x: event.clientX - left, y: event.clientY - top },
        });
    };
    parent.addEventListener("wheel", onWheel, { capture: true, passive: false });
    return () => {
        clearTimeout(settleTimer);
        parent.removeEventListener("wheel", onWheel, { capture: true });
    };
}
