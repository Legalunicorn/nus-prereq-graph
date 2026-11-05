import { describe, expect, it } from "vitest";
import { cleanRequirement, codesIn, focusAreasFor } from "./moduleDetails";

describe("cleanRequirement", () => {
    it("removes the degree boilerplate", () => {
        expect(cleanRequirement("If undertaking an Undergraduate DegreeTHEN( must have completed 1 of CS2040)"))
            .toBe("must have completed 1 of CS2040");
    });

    it("separates conditions that run together", () => {
        expect(cleanRequirement("at least DANDmust have")).toBe("at least D AND must have");
    });

    it("leaves other text alone", () => {
        expect(cleanRequirement("must have  completed CS2040")).toBe("must have completed CS2040");
    });
});

describe("codesIn", () => {
    it("finds module codes in a rule", () => {
        expect(codesIn("COURSES (1) CS1020:D, CS2040S:D AND COURSES (1) CS1020:D")).toEqual(["CS1020", "CS2040S"]);
    });

    it("handles a missing rule", () => {
        expect(codesIn(undefined)).toEqual([]);
    });
});

describe("focusAreasFor", () => {
    it("lists every area a module counts toward", () => {
        expect(focusAreasFor("CS4231")).toEqual(expect.arrayContaining([
            "Algorithms & Theory (primary)",
            "Parallel Computing (primary)",
        ]));
    });

    it("marks electives without a label", () => {
        expect(focusAreasFor("CS3233")).toEqual(["Algorithms & Theory"]);
    });

    it("is empty for a module in no area", () => {
        expect(focusAreasFor("MA1521")).toEqual([]);
    });
});
