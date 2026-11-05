import type cytoscape from "cytoscape";

// Cytoscape nodes only have one label, so a module's semesters are drawn as a small separate
// node under its card. Tags aren't part of the graph model or the layout.
const TAG_SELECTOR = 'node[kind="tag"]';
const TAG_OFFSET_Y = 28;

const tagId = (moduleId: string) => `tag:${moduleId}`;

const tagPosition = (node: cytoscape.NodeSingular) => ({
    x: node.position("x"),
    y: node.position("y") + TAG_OFFSET_Y,
});

export const withoutTags = (cy: cytoscape.Core) => cy.elements().not(TAG_SELECTOR);

export function syncSemesterTags(cy: cytoscape.Core) {
    cy.batch(() => {
        cy.nodes(TAG_SELECTOR).remove();
        cy.nodes('node[kind="module"][semesters != ""]').forEach(node => {
            cy.add({
                group: "nodes",
                data: {
                    id: tagId(node.id()),
                    kind: "tag",
                    label: node.data("semesters"),
                    notOffered: node.data("notOffered"),
                },
                classes: node.hasClass("off-path") ? "off-path" : "",
                position: tagPosition(node),
                grabbable: false,
                selectable: false,
            });
        });
    });
}

export function moveTagWithNode(cy: cytoscape.Core, node: cytoscape.NodeSingular) {
    cy.getElementById(tagId(node.id())).position(tagPosition(node));
}

export function includeTags(cy: cytoscape.Core, elements: cytoscape.CollectionReturnValue) {
    const tags = elements.nodes('[kind="module"]').map(node => cy.getElementById(tagId(node.id())));
    return tags.reduce((all, tag) => all.union(tag), elements);
}
