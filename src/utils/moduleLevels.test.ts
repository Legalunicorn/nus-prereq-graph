import { describe, expect, it } from "vitest";
import type { Mod } from "../types/types";
import { groupByLevel } from "./moduleLevels";

const mod = (code: string): Mod => ({ code, title: code, completed: false });
const summary = (codes: string[]) =>
    groupByLevel(codes.map(mod)).map(group => [group.label, group.mods.map(({ code }) => code)]);

describe("groupByLevel", () => {
    it("orders levels and sorts codes within them", () => {
        expect(summary(["CS3230", "MA1521", "CS2040S", "CS1231S"])).toEqual([
            ["1000 level", ["CS1231S", "MA1521"]],
            ["2000 level", ["CS2040S"]],
            ["3000 level", ["CS3230"]],
        ]);
    });

    it("works for codes from other faculties", () => {
        expect(summary(["GEA1000", "LAJ2201"])).toEqual([
            ["1000 level", ["GEA1000"]],
            ["2000 level", ["LAJ2201"]],
        ]);
    });

    it("puts a code with no number last", () => {
        expect(summary(["NODIGITS", "CS1010"]).map(([label]) => label)).toEqual(["1000 level", "Other"]);
    });

    it("is empty for an empty plan", () => {
        expect(groupByLevel([])).toEqual([]);
    });
});
