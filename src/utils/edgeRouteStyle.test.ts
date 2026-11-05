import { describe, expect, it } from "vitest";
import { controlPointsFor } from "./edgeRouteStyle";

describe("controlPointsFor", () => {
    it("gives weights and distances that rebuild each point", () => {
        const source = { x: 0, y: 0 };
        const target = { x: 100, y: 0 };
        const { weights, distances } = controlPointsFor(source, target, [{ x: 25, y: 40 }]);
        expect(weights[0]).toBeCloseTo(0.25);
        expect(distances[0]).toBeCloseTo(40);
    });

    it("handles nodes in the same spot", () => {
        const point = { x: 5, y: 5 };
        expect(controlPointsFor(point, point, [point])).toEqual({ weights: [], distances: [] });
    });
});
