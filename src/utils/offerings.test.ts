import { describe, expect, it } from "vitest";
import { isOffered, NOT_OFFERED, searchModules, semesterLabel } from "./offerings";
import type { ModuleListing } from "./offerings";

const listing = (semesters: number[], title = "Title"): ModuleListing => ({ title, semesters });

const offerings = new Map<string, ModuleListing>([
    ["BOTH", listing([1, 2])],
    ["ONE", listing([2])],
    ["WITH_ST", listing([1, 2, 4])],
    ["ONLY_ST", listing([3])],
    ["EMPTY", listing([])],
]);

describe("semesterLabel", () => {
    it.each([
        ["BOTH", ""],
        ["ONE", "S2"],
        ["WITH_ST", "+ST"],
        ["ONLY_ST", "ST"],
        ["EMPTY", NOT_OFFERED],
        ["ABSENT", NOT_OFFERED],
    ])("labels %s as %s", (code, label) => {
        expect(semesterLabel(offerings, code)).toBe(label);
    });
});

describe("isOffered", () => {
    it("is false for a module with no semesters or not in the list", () => {
        expect(isOffered(offerings, "ONE")).toBe(true);
        expect(isOffered(offerings, "EMPTY")).toBe(false);
        expect(isOffered(offerings, "ABSENT")).toBe(false);
    });
});

describe("searchModules", () => {
    const catalogue = new Map<string, ModuleListing>([
        ["AB1000", listing([1], "Intro to CS2100 ideas")],
        ["CS2100", listing([1], "Computer Organisation")],
        ["CS2100DE", listing([2], "Computer Organisation")],
        ["CS3210", listing([1], "Parallel Computing")],
    ]);
    const codes = (query: string) => searchModules(catalogue, query).map(result => result.code);

    it("matches codes ignoring case", () => {
        expect(codes("cs2100")).toEqual(["CS2100", "CS2100DE", "AB1000"]);
    });

    it("matches titles", () => {
        expect(codes("parallel")).toEqual(["CS3210"]);
    });

    it("lists code matches before title matches", () => {
        expect(codes("cs21")[0]).toBe("CS2100");
    });

    it("ignores very short queries", () => {
        expect(codes("c")).toEqual([]);
    });

    it("limits the number of results", () => {
        const many = new Map(Array.from({ length: 20 }, (_, i) => [`CS${i}`, listing([1])]));
        expect(searchModules(many, "cs")).toHaveLength(8);
    });
});
