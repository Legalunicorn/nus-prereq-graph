import type cytoscape from "cytoscape";
import { layoutFor } from "./cytoscapeConfig";
import type { GraphDirection } from "./cytoscapeConfig";
import { applyEdgeCurves, getDirection, setDirection } from "./edgeCurves";
import type { toElements } from "./graphElements";
import { syncSemesterTags, withoutTags } from "./semesterTags";
import { CELL_WIDTH, wrapRanks } from "./wrapRanks";

const MOVE_DURATION = 280;
const FIT_PADDING = 48;
// Vertical mode aims to keep nodes this large on screen, which sets how many fit in a row.
const READABLE_ZOOM = 0.8;
const MIN_PER_ROW = 2;

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function fadeIn(elements: cytoscape.CollectionReturnValue) {
    elements.style("opacity", 0).animate({
        style: { opacity: 1 },
        duration: MOVE_DURATION,
        // Clears the override so hover dimming keeps working.
        complete: () => { elements.removeStyle("opacity"); },
    });
}

function fitToWidth(cy: cytoscape.Core) {
    const nodes = withoutTags(cy).nodes();
    const maxPerRow = Math.max(MIN_PER_ROW, Math.floor(cy.width() / READABLE_ZOOM / CELL_WIDTH));
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
    }
    cy.fit(nodes, FIT_PADDING);
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
    const isSameDirection = getDirection(cy) === direction;
    setDirection(cy, direction);

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
        const isVertical = direction === "vertical";
        // Vertical layouts are packed once they finish, so gliding to the unpacked spot would look wrong.
        const shouldAnimate = !isVertical && currentIds.size > 0 && !prefersReducedMotion();
        withoutTags(cy).layout({
            ...layoutFor(direction),
            animate: shouldAnimate,
            animationDuration: MOVE_DURATION,
            animationEasing: "ease-out-cubic",
            animateFilter: (node: cytoscape.NodeSingular) => !added.contains(node),
            stop: () => {
                if (isVertical) {
                    fitToWidth(cy);
                }
                applyEdgeCurves(cy, cy.edges());
            },
        } as cytoscape.LayoutOptions).run();
        if (shouldAnimate) {
            fadeIn(added);
        }
    }

    syncSemesterTags(cy);
}
