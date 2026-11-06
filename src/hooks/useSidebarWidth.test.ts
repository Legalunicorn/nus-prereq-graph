import { describe, expect, it } from "vitest";
import { clampSidebarWidth } from "./useSidebarWidth";

describe("clampSidebarWidth", () => {
    it("keeps a width within the limits", () => {
        expect(clampSidebarWidth(500)).toBe(500);
    });

    it("stays wide enough for one card", () => {
        expect(clampSidebarWidth(50)).toBe(240);
    });

    it("stops at the maximum", () => {
        expect(clampSidebarWidth(5000)).toBe(800);
    });
});
