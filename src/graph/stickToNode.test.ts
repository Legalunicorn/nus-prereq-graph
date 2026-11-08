import { describe, expect, it } from "vitest";
import { placeAbove } from "./stickToNode";

describe("placeAbove", () => {
    const size = { w: 100, h: 20 };
    const view = { w: 800, h: 600 };

    it("centres above the node", () => {
        expect(placeAbove({ x: 400, y: 300, halfHeight: 16 }, size, view)).toEqual({ x: 350, y: 258 });
    });

    it("goes below when there's no room above", () => {
        expect(placeAbove({ x: 400, y: 30, halfHeight: 16 }, size, view)).toEqual({ x: 350, y: 52 });
    });

    it("stays inside the graph's sides", () => {
        expect(placeAbove({ x: 10, y: 300, halfHeight: 16 }, size, view)?.x).toBe(4);
        expect(placeAbove({ x: 795, y: 300, halfHeight: 16 }, size, view)?.x).toBe(696);
    });

    it("is null while the node is off screen", () => {
        expect(placeAbove({ x: -5, y: 300, halfHeight: 16 }, size, view)).toBeNull();
        expect(placeAbove({ x: 400, y: 601, halfHeight: 16 }, size, view)).toBeNull();
    });
});
