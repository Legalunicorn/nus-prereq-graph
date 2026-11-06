import { describe, expect, it } from "vitest";
import { fitZoom, wheelZoomFactor } from "./viewport";

describe("wheelZoomFactor", () => {
    const wheel = (deltaY: number, deltaMode = 0, ctrlKey = false) => ({ deltaY, deltaMode, ctrlKey });

    it("takes a small step for one mouse notch", () => {
        expect(wheelZoomFactor(wheel(100))).toBeCloseTo(0.905, 3);
        expect(wheelZoomFactor(wheel(-100))).toBeCloseTo(1.105, 3);
    });

    it("limits a large or fast scroll to one step", () => {
        expect(wheelZoomFactor(wheel(5000))).toBe(wheelZoomFactor(wheel(120)));
        expect(wheelZoomFactor(wheel(3, 1))).toBe(wheelZoomFactor(wheel(99)));
        expect(wheelZoomFactor(wheel(1, 2))).toBe(wheelZoomFactor(wheel(120)));
    });

    it("gives a pinch more zoom per pixel", () => {
        expect(wheelZoomFactor(wheel(-10, 0, true))).toBeCloseTo(1.105, 3);
    });

    it("leaves the zoom alone without vertical movement", () => {
        expect(wheelZoomFactor(wheel(0))).toBe(1);
    });
});

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
