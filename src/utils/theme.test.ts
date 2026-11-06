import { describe, expect, it } from "vitest";
import { resolveTheme, shade } from "./theme";

describe("shade", () => {
    it("mixes toward white or black", () => {
        expect(shade("#804020", 0.5)).toBe("rgb(192,160,144)");
        expect(shade("#804020", -0.5)).toBe("rgb(64,32,16)");
    });

    it("leaves the color alone at zero", () => {
        expect(shade("#804020", 0)).toBe("rgb(128,64,32)");
    });
});

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
