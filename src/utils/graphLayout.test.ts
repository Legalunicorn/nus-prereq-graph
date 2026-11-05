import { describe, expect, it } from "vitest";
import { bendsOf, computeLayout, segmentsFor, wrappedRoutes } from "./graphLayout";

const node = (id: string) => ({ id, width: 86, height: 32 });

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

describe("computeLayout", () => {
    const nodes = ["a", "b", "c"].map(node);
    const chain = [
        { id: "ab", source: "a", target: "b" },
        { id: "bc", source: "b", target: "c" },
    ];
    const skipping = [...chain, { id: "ac", source: "a", target: "c" }];

    it("places every node and orders them along the direction", () => {
        const { positions } = computeLayout(nodes, skipping, "horizontal");
        expect(positions.a.x).toBeLessThan(positions.b.x);
        expect(positions.b.x).toBeLessThan(positions.c.x);
    });

    it("keeps an aligned chain straight", () => {
        const { routes } = computeLayout(nodes, chain, "horizontal");
        expect(routes.get("ab")).toEqual([]);
        expect(routes.get("bc")).toEqual([]);
    });

    it("routes an edge around the node it would otherwise cross", () => {
        const { positions, routes } = computeLayout(nodes, skipping, "horizontal");
        const bends = routes.get("ac") ?? [];
        const besideB = bends.filter(bend => Math.abs(bend.x - positions.b.x) <= node("b").width / 2);
        expect(bends.length).toBeGreaterThan(0);
        expect(besideB.every(bend => Math.abs(bend.y - positions.b.y) > node("b").height / 2)).toBe(true);
    });

    it("leaves a card along the direction before turning", () => {
        const { positions, routes } = computeLayout(nodes, skipping, "vertical");
        const [firstBend] = routes.get("ac") ?? [];
        expect(firstBend.x).toBeCloseTo(positions.a.x);
        expect(firstBend.y).toBeGreaterThan(positions.a.y + node("a").height / 2);
    });
});

describe("wrappedRoutes", () => {
    const edge = { id: "e", source: "a", target: "b" };

    it("leaves and enters cards vertically", () => {
        const routes = wrappedRoutes([edge], { a: { x: 0, y: 0 }, b: { x: 100, y: 200 } });
        const [first, last] = routes.get("e") ?? [];
        expect(first.x).toBe(0);
        expect(last.x).toBe(100);
    });

    it("stays straight between rows too close to bend", () => {
        const routes = wrappedRoutes([edge], { a: { x: 0, y: 0 }, b: { x: 100, y: 20 } });
        expect(routes.get("e")).toEqual([]);
    });
});

describe("segmentsFor", () => {
    it("gives weights and distances that rebuild each point", () => {
        const source = { x: 0, y: 0 };
        const target = { x: 100, y: 0 };
        const { weights, distances } = segmentsFor(source, target, [{ x: 25, y: 40 }]);
        expect(weights[0]).toBeCloseTo(0.25);
        expect(distances[0]).toBeCloseTo(40);
    });

    it("handles nodes in the same spot", () => {
        const point = { x: 5, y: 5 };
        expect(segmentsFor(point, point, [point])).toEqual({ weights: [], distances: [] });
    });
});
