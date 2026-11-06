import { describe, expect, it } from "vitest";
import type { Mod } from "../types/types";
import { groupMods } from "./moduleGroups";
import type { GroupBy } from "./moduleGroups";

const mod = (code: string, status: Partial<Mod> = {}): Mod => ({ code, title: code, completed: false, ...status });
const summary = (mods: Mod[], by: GroupBy) =>
    groupMods(mods, by, () => 4).map(group => [group.label, group.mods.map(({ code }) => code)]);

describe("groupMods by level", () => {
    it("orders levels and sorts codes within them", () => {
        expect(summary(["CS3230", "MA1521", "CS2040S", "CS1231S"].map(code => mod(code)), "level")).toEqual([
            ["1000 level", ["CS1231S", "MA1521"]],
            ["2000 level", ["CS2040S"]],
            ["3000 level", ["CS3230"]],
        ]);
    });

    it("works for codes from other faculties", () => {
        expect(summary([mod("LAJ2201"), mod("GEA1000")], "level")).toEqual([
            ["1000 level", ["GEA1000"]],
            ["2000 level", ["LAJ2201"]],
        ]);
    });

    it("puts a code with no number last", () => {
        expect(summary([mod("NODIGITS"), mod("CS1010")], "level").map(([label]) => label)).toEqual(["1000 level", "Other"]);
    });

    it("is empty for an empty plan", () => {
        expect(groupMods([], "level", () => 0)).toEqual([]);
    });
});

describe("groupMods by status", () => {
    it("orders taking, planned, then done, leaving out empty groups", () => {
        const mods = [mod("C1", { completed: true }), mod("B1"), mod("A1", { completed: true })];
        expect(summary(mods, "status")).toEqual([["Planned", ["B1"]], ["Done", ["A1", "C1"]]]);
        expect(summary([mod("D1", { taking: true }), mod("B1")], "status")[0]).toEqual(["Taking", ["D1"]]);
    });
});

describe("groupMods by term", () => {
    it("orders terms, totals credits and puts no term last without a total", () => {
        const mods = [mod("C1"), mod("B1", { plannedTerm: "Y2S1" }), mod("A1", { plannedTerm: "Y1S1" })];
        const groups = groupMods(mods, "term", () => 4);
        expect(groups.map(group => group.label)).toEqual(["Y1S1", "Y2S1", "No term"]);
        expect(groups.map(group => group.credits)).toEqual([4, 4, undefined]);
    });
});
