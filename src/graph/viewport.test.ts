import { describe, expect, it } from "vitest";
import { fitZoom } from "./viewport";

describe("fitZoom", () => {
    const view = { w: 1000, h: 800 };

    it("shrinks a large graph to fit its tighter side", () => {
        expect(fitZoom({ w: 2000, h: 500 }, view, 0)).toBe(0.5);
        expect(fitZoom({ w: 500, h: 1600 }, view, 0)).toBe(0.5);
    });

    it("leaves room for padding", () => {
        expect(fitZoom({ w: 900, h: 100 }, view, 50)).toBe(1);
    });

    it("doesn't blow up a small graph", () => {
        expect(fitZoom({ w: 100, h: 50 }, view)).toBe(1.25);
    });

    it("handles a graph with no size", () => {
        expect(fitZoom({ w: 0, h: 0 }, view)).toBe(1.25);
    });
});
