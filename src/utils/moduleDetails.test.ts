import { describe, expect, it } from "vitest";
import { cleanRequirement, codesIn, focusAreasFor, mentionsProgrammes } from "./moduleDetails";

describe("cleanRequirement", () => {
    it("removes the degree boilerplate", () => {
        expect(cleanRequirement("If undertaking an Undergraduate DegreeTHEN( must have completed 1 of CS2040)"))
            .toBe("must have completed 1 of CS2040");
    });

    it("separates conditions that run together", () => {
        expect(cleanRequirement("at least DANDmust have")).toBe("at least D AND must have");
    });

    it("shortens a programme list inside a condition", () => {
        const text = "(must not have completed 1 of MA1311 at a grade of at least D) AND (must not be undertaking 1 of 0601BMEHON Bachelor of Engineering (Biomedical Engineering) (Hons), 0602CHEHON Bachelor of Engineering (Chemical Engineering) (Hons))";
        expect(cleanRequirement(text)).toBe("(must not have completed 1 of MA1311 at a grade of at least D) AND (must not be undertaking certain programmes)");
    });

    it("keeps the condition after a programme list", () => {
        expect(cleanRequirement("(must be undertaking 1 of 0601BMEHON Bachelor (Hons)) AND (must have completed CS2040)"))
            .toBe("(must be undertaking certain programmes) AND (must have completed CS2040)");
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

describe("mentionsProgrammes", () => {
    it("spots programme codes but not module codes", () => {
        expect(mentionsProgrammes("must not be undertaking 0601BMEHON")).toBe(true);
        expect(mentionsProgrammes("CS2040S")).toBe(false);
        expect(mentionsProgrammes(undefined)).toBe(false);
    });
});

describe("focusAreasFor", () => {
    it("lists every area a module counts toward", () => {
        expect(focusAreasFor("CS4231")).toEqual(expect.arrayContaining([
            "Algorithms & Theory (primary)",
            "Parallel Computing (primary)",
        ]));
    });

    it("counts either CS2103 code toward Software Engineering", () => {
        expect(focusAreasFor("CS2103T")).toEqual(["Software Engineering (primary)"]);
        expect(focusAreasFor("CS2103")).toEqual(["Software Engineering (primary)"]);
    });

    it("marks electives without a label", () => {
        expect(focusAreasFor("CS3233")).toEqual(["Algorithms & Theory"]);
    });

    it("is empty for a module in no area", () => {
        expect(focusAreasFor("MA1521")).toEqual([]);
    });
});
