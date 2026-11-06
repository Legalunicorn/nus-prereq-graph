import { describe, expect, it } from "vitest";
import { layoutKey } from "./layoutClient";

const nodes = [{ id: "a", width: 86, height: 32 }];
const edges = [{ id: "e", source: "a", target: "b" }];

describe("layoutKey", () => {
    it("matches for the same graph and direction", () => {
        expect(layoutKey(nodes, edges, "vertical")).toBe(layoutKey([...nodes], [...edges], "vertical"));
    });

    it("differs by direction", () => {
        expect(layoutKey(nodes, edges, "vertical")).not.toBe(layoutKey(nodes, edges, "horizontal"));
    });

    it("differs when a node's size changes", () => {
        expect(layoutKey([{ ...nodes[0], width: 40 }], edges, "vertical")).not.toBe(layoutKey(nodes, edges, "vertical"));
    });
});
