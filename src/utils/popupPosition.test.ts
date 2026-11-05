import { describe, expect, it } from "vitest";
import { popupPosition } from "./popupPosition";

describe("popupPosition", () => {
    it("leaves a position in the middle alone", () => {
        expect(popupPosition(500, 200, 1000, 800)).toEqual({ x: 500, y: 200 });
    });

    it("keeps the popup inside the left and right edges", () => {
        expect(popupPosition(0, 200, 1000, 800).x).toBe(103);
        expect(popupPosition(1000, 200, 1000, 800).x).toBe(897);
    });

    it("moves up near the bottom edge", () => {
        expect(popupPosition(500, 790, 1000, 800).y).toBe(578);
    });

    it("never goes above the top edge", () => {
        expect(popupPosition(500, 100, 1000, 100).y).toBe(0);
    });
});
