import type cytoscape from "cytoscape";
import type { GraphDirection } from "./cytoscapeConfig";
import { applyRoutes } from "./edgeRouteStyle";
import { computeLayout } from "./graphLayout";
import type { toElements } from "./graphElements";
import { syncSemesterTags, withoutTags } from "./semesterTags";

const FADE_MS = 120;
const FADE_TIMER_KEY = "fadeTimer";
const DIRECTION_KEY = "direction";
const READABLE_ZOOM = 0.6;
const START_PADDING = 56;

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A graph too big to read when fitted opens at the start of its chain instead. Fit still shows all of it. */
function keepReadable(cy: cytoscape.Core, direction: GraphDirection) {
    if (cy.zoom() >= READABLE_ZOOM) {
        return;
    }
    const box = withoutTags(cy).boundingBox();
    cy.zoom(READABLE_ZOOM);
    cy.pan(direction === "vertical"
        ? { x: (cy.width() - box.w * READABLE_ZOOM) / 2 - box.x1 * READABLE_ZOOM, y: START_PADDING - box.y1 * READABLE_ZOOM }
        : { x: START_PADDING - box.x1 * READABLE_ZOOM, y: (cy.height() - box.h * READABLE_ZOOM) / 2 - box.y1 * READABLE_ZOOM });
}

function runLayout(cy: cytoscape.Core, direction: GraphDirection) {
    const elements = withoutTags(cy);
    const { positions, routes } = computeLayout(
        elements.nodes().map(node => ({ id: node.id(), width: node.outerWidth(), height: node.outerHeight() })),
        elements.edges().map(edge => ({ id: edge.id(), source: edge.source().id(), target: edge.target().id() })),
        direction,
    );
    applyRoutes(cy, routes, positions);
    elements.layout({ name: "preset", positions, stop: () => keepReadable(cy, direction) } as cytoscape.LayoutOptions).run();
    syncSemesterTags(cy);
    elements.removeStyle("opacity");
}

/**
 * Updates what's on screen. Kept elements update in place. The layout, and so the view, only
 * changes if elements were added or removed, or the direction changed. That change is a crossfade,
 * as curved edges distort if their nodes glide to new positions.
 */
export function syncGraph(cy: cytoscape.Core, elements: ReturnType<typeof toElements>, direction: GraphDirection) {
    const current = withoutTags(cy);
    const currentIds = new Set(current.map(element => element.id()));
    const nextIds = new Set(elements.map(element => element.data.id));
    const newElements = elements.filter(element => !currentIds.has(element.data.id));
    const isSameStructure = newElements.length === 0 && currentIds.size === nextIds.size;
    const isSameDirection = cy.scratch(DIRECTION_KEY) === direction;
    cy.scratch(DIRECTION_KEY, direction);

    cy.batch(() => {
        current.filter(element => !nextIds.has(element.id())).remove();
        for (const { data } of elements) {
            if (currentIds.has(data.id)) {
                cy.getElementById(data.id).data(data);
            }
        }
    });

    if (isSameStructure && isSameDirection) {
        syncSemesterTags(cy);
        return;
    }

    const added = cy.add(newElements);
    const container = cy.container();
    clearTimeout(cy.scratch(FADE_TIMER_KEY));
    if (currentIds.size === 0 || !container || prefersReducedMotion()) {
        runLayout(cy, direction);
        if (container) {
            container.style.opacity = "";
        }
        return;
    }
    added.style("opacity", 0);
    container.style.opacity = "0";
    cy.scratch(FADE_TIMER_KEY, setTimeout(() => {
        if (!cy.destroyed()) {
            runLayout(cy, direction);
            container.style.opacity = "";
        }
    }, FADE_MS));
}
