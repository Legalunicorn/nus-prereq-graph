import type cytoscape from "cytoscape";
import type { GraphDirection } from "./cytoscapeConfig";
import { applyRoutes, computeLayout, wrappedRoutes } from "./graphLayout";
import type { toElements } from "./graphElements";
import { syncSemesterTags, withoutTags } from "./semesterTags";
import { CELL_WIDTH, wrapRanks } from "./wrapRanks";

const MOVE_DURATION = 280;
const FIT_PADDING = 48;
// Vertical mode aims to keep nodes this large on screen, which sets how many fit in a row.
const READABLE_ZOOM = 0.8;
const MIN_PER_ROW = 2;
const MAX_PER_ROW_KEY = "maxPerRow";
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

const toLayoutEdge = (edge: cytoscape.EdgeSingular) => ({ id: edge.id(), source: edge.source().id(), target: edge.target().id() });

const maxPerRowFor =(cy: cytoscape.Core) =>
    Math.max(MIN_PER_ROW, Math.floor(cy.width() / READABLE_ZOOM / CELL_WIDTH));

function fitToWidth(cy: cytoscape.Core) {
    const nodes = withoutTags(cy).nodes();
    const maxPerRow = maxPerRowFor(cy);
    cy.scratch(MAX_PER_ROW_KEY, maxPerRow);
    const placed = wrapRanks(
        nodes.map(node => ({ id: node.id(), ...node.position() })),
        maxPerRow,
    );
    if (placed) {
        nodes.forEach(node => {
            const position = placed.get(node.id());
            if (position) {
                node.position(position);
            }
        });
        const positions = Object.fromEntries(nodes.map(node => [node.id(), node.position()]));
        applyRoutes(cy, wrappedRoutes(withoutTags(cy).edges().map(toLayoutEdge), positions), positions);
    }
    cy.fit(nodes, FIT_PADDING);
}

function runLayout(cy: cytoscape.Core, direction: GraphDirection, added: cytoscape.CollectionReturnValue, shouldAnimate: boolean) {
    const elements = withoutTags(cy);
    const { positions, routes } = computeLayout(
        elements.nodes().map(node => ({ id: node.id(), width: node.outerWidth(), height: node.outerHeight() })),
        elements.edges().map(toLayoutEdge),
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
        stop: () => {
            if (direction === "vertical") {
                fitToWidth(cy);
            }
        },
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
        // Vertical layouts are packed once they finish, so gliding to the unpacked spot would look wrong.
        const shouldAnimate = direction !== "vertical" && currentIds.size > 0 && !prefersReducedMotion();
        runLayout(cy, direction, added, shouldAnimate);
        if (shouldAnimate) {
            fadeIn(added);
        }
    }

    syncSemesterTags(cy);
}

/** Only re-wraps when the row size changes, so panels opening or a phone's address bar hiding keep the view. */
export function rewrapOnResize(cy: cytoscape.Core) {
    cy.resize();
    if (cy.scratch(DIRECTION_KEY) !== "vertical" || maxPerRowFor(cy) === cy.scratch(MAX_PER_ROW_KEY)) {
        return;
    }
    runLayout(cy, "vertical", cy.collection(), false);
}
