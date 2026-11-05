import type cytoscape from "cytoscape";
import type { GraphDirection } from "./cytoscapeConfig";
import { applyRoutes, computeLayout } from "./graphLayout";
import type { toElements } from "./graphElements";
import { syncSemesterTags, withoutTags } from "./semesterTags";

const MOVE_DURATION = 280;
const DIRECTION_KEY = "direction";
const READABLE_ZOOM = 0.6;
const START_PADDING = 56;

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function fadeIn(elements: cytoscape.CollectionReturnValue) {
    elements.style("opacity", 0).animate({
        style: { opacity: 1 },
        duration: MOVE_DURATION,
        // Clears the override so hover dimming keeps working.
        complete: () => { elements.removeStyle("opacity"); },
    });
}

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

function runLayout(cy: cytoscape.Core, direction: GraphDirection, added: cytoscape.CollectionReturnValue, shouldAnimate: boolean) {
    const elements = withoutTags(cy);
    const { positions, routes } = computeLayout(
        elements.nodes().map(node => ({ id: node.id(), width: node.outerWidth(), height: node.outerHeight() })),
        elements.edges().map(edge => ({ id: edge.id(), source: edge.source().id(), target: edge.target().id() })),
        direction,
    );
    applyRoutes(cy, routes, positions);
    elements.layout({
        name: "preset",
        positions,
        animate: shouldAnimate,
        animationDuration: MOVE_DURATION,
        animationEasing: "ease-out-cubic",
        animateFilter: (node: cytoscape.NodeSingular) => !added.contains(node),
        stop: () => keepReadable(cy, direction),
    } as cytoscape.LayoutOptions).run();
}

/**
 * Updates what's on screen. Kept elements update in place. The layout, and so the view, only
 * changes if elements were added or removed, or the direction changed.
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

    if (!isSameStructure || !isSameDirection) {
        const added = cy.add(newElements);
        const shouldAnimate = currentIds.size > 0 && !prefersReducedMotion();
        runLayout(cy, direction, added, shouldAnimate);
        if (shouldAnimate) {
            fadeIn(added);
        }
    }

    syncSemesterTags(cy);
}
