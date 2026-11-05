import type cytoscape from "cytoscape";
import { cytoscapeLayout } from "./cytoscapeConfig";
import type { toElements } from "./graphElements";
import { syncSemesterTags, withoutTags } from "./semesterTags";

const MOVE_DURATION = 280;

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
export function syncGraph(cy: cytoscape.Core, elements: ReturnType<typeof toElements>) {
    const current = withoutTags(cy);
    const currentIds = new Set(current.map(element => element.id()));
    const nextIds = new Set(elements.map(element => element.data.id));
    const newElements = elements.filter(element => !currentIds.has(element.data.id));
    const isSameStructure = newElements.length === 0 && currentIds.size === nextIds.size;

    cy.batch(() => {
        current.filter(element => !nextIds.has(element.id())).remove();
        for (const { data } of elements) {
            if (currentIds.has(data.id)) {
                cy.getElementById(data.id).data(data);
            }
        }
    });

    if (!isSameStructure) {
        const added = cy.add(newElements);
        const shouldAnimate = currentIds.size > 0 && !prefersReducedMotion();
        withoutTags(cy).layout({
            ...cytoscapeLayout,
            animate: shouldAnimate,
            animationDuration: MOVE_DURATION,
            animationEasing: "ease-out-cubic",
            animateFilter: (node: cytoscape.NodeSingular) => !added.contains(node),
        } as cytoscape.LayoutOptions).run();
        if (shouldAnimate) {
            fadeIn(added);
        }
    }

    syncSemesterTags(cy);
}
