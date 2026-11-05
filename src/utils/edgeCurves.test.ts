import { describe, expect, it } from "vitest";
import { curveFor } from "./edgeCurves";

describe("curveFor", () => {
    it("is straight when the two nodes line up", () => {
        const curve = curveFor({ x: 0, y: 0 }, { x: 100, y: 0 }, "horizontal");
        expect(curve.distances).toEqual([0, 0]);
        expect(curve.weights).toEqual([0.5, 0.5]);
    });

    it("bends in opposite directions to form an S", () => {
        const { distances } = curveFor({ x: 0, y: 0 }, { x: 100, y: 80 }, "horizontal");
        expect(distances[0]).toBeCloseTo(-distances[1]);
        expect(distances[0]).not.toBe(0);
    });

    it("keeps both control points between the nodes", () => {
        const { weights } = curveFor({ x: 0, y: 0 }, { x: 100, y: 80 }, "vertical");
        for (const weight of weights) {
            expect(weight).toBeGreaterThan(0);
            expect(weight).toBeLessThan(1);
        }
    });

    it("doesn't fail on nodes in the same place", () => {
        expect(curveFor({ x: 5, y: 5 }, { x: 5, y: 5 }, "vertical").distances).toEqual([0, 0]);
    });
});
