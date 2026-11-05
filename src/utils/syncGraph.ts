import type cytoscape from "cytoscape";
import { layoutFor } from "./cytoscapeConfig";
import type { GraphDirection } from "./cytoscapeConfig";
import { applyEdgeTracks } from "./edgeTracks";
import type { toElements } from "./graphElements";
import { syncSemesterTags, withoutTags } from "./semesterTags";

const MOVE_DURATION = 280;
const DIRECTION_KEY = "direction";

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function fadeIn(elements: cytoscape.CollectionReturnValue) {
    elements.style("opacity", 0).animate({
        style: { opacity: 1 },
        duration: MOVE_DURATION,
        // Clears the override so hover dimming keeps working.
        complete: () => { elements.removeStyle("opacity"); },
    });
}

/**
 * Updates what's on screen. Kept elements update in place. The layout, and so the view, only
 * changes if elements were added or removed: kept nodes glide to their new spots and new ones fade in.
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
        withoutTags(cy).layout({
            ...layoutFor(direction),
            animate: shouldAnimate,
            animationDuration: MOVE_DURATION,
            animationEasing: "ease-out-cubic",
            animateFilter: (node: cytoscape.NodeSingular) => !added.contains(node),
            stop: () => applyEdgeTracks(cy, direction),
        } as cytoscape.LayoutOptions).run();
        if (shouldAnimate) {
            fadeIn(added);
        }
    }

    syncSemesterTags(cy);
}
