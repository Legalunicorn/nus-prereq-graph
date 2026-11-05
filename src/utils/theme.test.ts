import { describe, expect, it } from "vitest";
import { resolveTheme } from "./theme";

describe("resolveTheme", () => {
    it("uses a saved choice over the system setting", () => {
        expect(resolveTheme("light", true)).toBe("light");
        expect(resolveTheme("dark", false)).toBe("dark");
    });

    it("follows the system setting when nothing is saved", () => {
        expect(resolveTheme(null, true)).toBe("dark");
        expect(resolveTheme(null, false)).toBe("light");
    });

    it("ignores an unknown saved value", () => {
        expect(resolveTheme("blue", true)).toBe("dark");
    });
});
