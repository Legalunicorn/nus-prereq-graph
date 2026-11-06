import type cytoscape from "cytoscape";
import type { GraphDirection } from "./cytoscapeConfig";
import { applyRoutes } from "./edgeRouteStyle";
import type { LayoutResult } from "./graphLayout";
import { requestLayout } from "./layoutClient";
import type { toElements } from "./graphElements";
import { removeOrphanTags, syncSemesterTags, withoutTags } from "./semesterTags";
import { openView } from "./viewport";

const FADE_MS = 120;
const FADE_TIMER_KEY = "fadeTimer";
const DIRECTION_KEY = "direction";
const LAYOUT_TOKEN_KEY = "layoutToken";
const IS_LAYOUT_PENDING_KEY = "isLayoutPending";

function showLayout(cy: cytoscape.Core, direction: GraphDirection, { positions, routes }: LayoutResult) {
    const elements = withoutTags(cy);
    applyRoutes(cy, routes, positions);
    elements.layout({ name: "preset", positions, fit: false, stop: () => openView(cy, direction) } as cytoscape.LayoutOptions).run();
    syncSemesterTags(cy);
    elements.removeStyle("opacity");
    cy.scratch(IS_LAYOUT_PENDING_KEY, false);
    const container = cy.container();
    if (container) {
        container.style.opacity = "";
    }
}

function relayout(cy: cytoscape.Core, direction: GraphDirection, isFirstDraw: boolean) {
    const token = (cy.scratch(LAYOUT_TOKEN_KEY) ?? 0) + 1;
    cy.scratch(LAYOUT_TOKEN_KEY, token);
    cy.scratch(IS_LAYOUT_PENDING_KEY, true);
    clearTimeout(cy.scratch(FADE_TIMER_KEY));
    const isCurrent = () => !cy.destroyed() && cy.scratch(LAYOUT_TOKEN_KEY) === token;

    const elements = withoutTags(cy);
    requestLayout(
        elements.nodes().map(node => ({ id: node.id(), width: node.outerWidth(), height: node.outerHeight() })),
        elements.edges().map(edge => ({ id: edge.id(), source: edge.source().id(), target: edge.target().id() })),
        direction,
    ).then(layout => {
        if (!isCurrent()) {
            return;
        }
        const container = cy.container();
        if (isFirstDraw || !container) {
            showLayout(cy, direction, layout);
            return;
        }
        // The old graph stays usable until the new layout is ready, then they crossfade.
        container.style.opacity = "0";
        cy.scratch(FADE_TIMER_KEY, setTimeout(() => {
            if (isCurrent()) {
                showLayout(cy, direction, layout);
            }
        }, FADE_MS));
    });
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

    if (isSameStructure && isSameDirection) {
        // A pending layout brings tags up to date itself, and new modules aren't placed yet.
        if (!cy.scratch(IS_LAYOUT_PENDING_KEY)) {
            syncSemesterTags(cy);
        }
        return;
    }

    cy.add(newElements).style("opacity", 0);
    removeOrphanTags(cy);
    relayout(cy, direction, currentIds.size === 0);
}
