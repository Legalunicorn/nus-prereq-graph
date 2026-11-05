import { describe, expect, it } from "vitest";
import { resolveDirection } from "./useGraphDirection";

describe("resolveDirection", () => {
    it("uses a saved choice over the screen size", () => {
        expect(resolveDirection("horizontal", true)).toBe("horizontal");
        expect(resolveDirection("vertical", false)).toBe("vertical");
    });

    it("follows the screen size when nothing is saved", () => {
        expect(resolveDirection(null, true)).toBe("vertical");
        expect(resolveDirection(null, false)).toBe("horizontal");
    });

    it("ignores an unknown saved value", () => {
        expect(resolveDirection("diagonal", false)).toBe("horizontal");
    });
});
