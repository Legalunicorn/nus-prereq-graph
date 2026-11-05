import { describe, expect, it } from "vitest";
import { bendsOf, computeLayout, countCrossings, portOffsets } from "./graphLayout";

const node = (id: string) => ({ id, width: 86, height: 32 });
const edge = (source: string, target: string) => ({ id: `${source}-${target}`, source, target });

describe("bendsOf", () => {
    it("drops points on a straight run", () => {
        const points = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 0 }, { x: 30, y: 0 }];
        expect(bendsOf(points)).toEqual([]);
    });

    it("keeps the turns", () => {
        const points = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 10 }, { x: 30, y: 20 }, { x: 40, y: 20 }];
        expect(bendsOf(points)).toContainEqual({ x: 10, y: 0 });
    });
});

describe("portOffsets", () => {
    it("centres a single edge", () => {
        expect(portOffsets(1, 32)).toEqual([0]);
    });

    it("spreads edges evenly around the centre", () => {
        expect(portOffsets(3, 32)).toEqual([-7, 0, 7]);
    });

    it("keeps every edge on the side of the node", () => {
        const offsets = portOffsets(9, 16);
        expect(Math.max(...offsets)).toBeLessThanOrEqual(8);
        expect(new Set(offsets).size).toBe(9);
    });
});

describe("countCrossings", () => {
    it("counts lines that cross", () => {
        const lines = [[{ x: 0, y: 0 }, { x: 10, y: 10 }], [{ x: 0, y: 10 }, { x: 10, y: 0 }]];
        expect(countCrossings(lines)).toBe(1);
    });

    it("ignores parallel lines", () => {
        const lines = [[{ x: 0, y: 0 }, { x: 10, y: 0 }], [{ x: 0, y: 5 }, { x: 10, y: 5 }]];
        expect(countCrossings(lines)).toBe(0);
    });
});

describe("computeLayout", () => {
    const nodes = ["a", "b", "c"].map(node);
    const chain = [edge("a", "b"), edge("b", "c")];
    const skipping = [...chain, edge("a", "c")];

    it("places every node and orders them along the direction", () => {
        const { positions } = computeLayout(nodes, skipping, "horizontal");
        expect(positions.a.x).toBeLessThan(positions.b.x);
        expect(positions.b.x).toBeLessThan(positions.c.x);
    });

    it("keeps an aligned chain straight", () => {
        const { routes } = computeLayout(nodes, chain, "horizontal");
        expect(routes.get("a-b")?.bends).toEqual([]);
        expect(routes.get("b-c")?.bends).toEqual([]);
    });

    it("routes an edge around the node it would otherwise cross", () => {
        const { positions, routes } = computeLayout(nodes, skipping, "horizontal");
        const bends = routes.get("a-c")?.bends ?? [];
        const besideB = bends.filter(bend => Math.abs(bend.x - positions.b.x) <= node("b").width / 2);
        expect(bends.length).toBeGreaterThan(0);
        expect(besideB.every(bend => Math.abs(bend.y - positions.b.y) > node("b").height / 2)).toBe(true);
    });

    it("gives edges from one node separate attachment points", () => {
        const { routes } = computeLayout(["a", "b", "c"].map(node), [edge("a", "b"), edge("a", "c")], "horizontal");
        expect(routes.get("a-b")?.sourceEnd.y).not.toBe(routes.get("a-c")?.sourceEnd.y);
    });

    it("avoids crossings when an order without them exists", () => {
        const ids = ["a", "b", "c", "d", "e", "f"];
        const edges = [edge("a", "d"), edge("b", "e"), edge("c", "f")];
        const { positions } = computeLayout(ids.map(node), edges, "horizontal");
        const order = (first: string[]) => [...first].sort((p, q) => positions[p].y - positions[q].y);
        const pairs = new Map([["a", "d"], ["b", "e"], ["c", "f"]]);
        expect(order(["d", "e", "f"])).toEqual(order(["a", "b", "c"]).map(id => pairs.get(id)));
    });

    it("gives the same result for the same input", () => {
        const first = computeLayout(nodes, skipping, "vertical");
        const second = computeLayout(nodes, skipping, "vertical");
        expect(second.positions).toEqual(first.positions);
    });
});

