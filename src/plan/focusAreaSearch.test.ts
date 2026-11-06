import { describe, expect, it } from "vitest";
import type { FocusArea } from "../data/focusAreas";
import { meetsFocusAreaRule, searchFocusAreas } from "./focusAreaSearch";

const area = (name: string, primaries: string[], electives: string[] = []): FocusArea => ({
    id: name,
    name,
    description: "",
    primaries: primaries.map(code => ({ code, title: `${code} title` })),
    electives: electives.map(code => ({ code, title: `${code} title` })),
});

describe("searchFocusAreas", () => {
    const areas = [area("Algo", ["CS3230", "CS4231"]), area("Parallel", ["CS4231"], ["CS3211"])];

    it("lists a course once with every area it counts toward", () => {
        expect(searchFocusAreas(areas, "cs4231")).toEqual([
            { code: "CS4231", title: "CS4231 title", note: "Algo (primary), Parallel (primary)" },
        ]);
    });

    it("marks electives without a label", () => {
        expect(searchFocusAreas(areas, "CS3211")[0].note).toBe("Parallel");
    });

    it("matches titles", () => {
        expect(searchFocusAreas(areas, "title")).toHaveLength(3);
    });

    it("returns nothing for an empty query", () => {
        expect(searchFocusAreas(areas, "  ")).toEqual([]);
    });
});

describe("meetsFocusAreaRule", () => {
    const algo = area("Algo", ["CS3230", "CS3231", "CS3233", "CS4231"]);

    it("needs three primaries including one at level 4000", () => {
        expect(meetsFocusAreaRule(algo, new Set(["CS3230", "CS3231", "CS4231"]))).toBe(true);
    });

    it("fails with too few primaries", () => {
        expect(meetsFocusAreaRule(algo, new Set(["CS3230", "CS4231"]))).toBe(false);
    });

    it("fails without a level 4000 primary", () => {
        expect(meetsFocusAreaRule(algo, new Set(["CS3230", "CS3231", "CS3233"]))).toBe(false);
    });
});
