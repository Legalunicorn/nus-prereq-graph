import { describe, expect, it } from "vitest";
import type { Mod, PrereqTree, Term } from "../types/types";
import type { Offerings } from "./offerings";
import { groupByTerm, planWarnings } from "./semesterPlan";

const mod = (code: string, plannedTerm?: Term, prereqTree?: PrereqTree, status: Partial<Mod> = {}): Mod => ({
    code,
    title: code,
    completed: false,
    plannedTerm,
    prereqTree,
    ...status,
});

const NO_OFFERINGS: Offerings = new Map();
const offeredIn = (code: string, semesters: number[]): Offerings => new Map([[code, { title: code, semesters }]]);

describe("planWarnings: prerequisites", () => {
    it("warns about a prerequisite in a later term", () => {
        const mods = [mod("CS2040S", "Y2S1"), mod("CS3230", "Y1S2", "CS2040S:D")];
        expect(planWarnings(mods, NO_OFFERINGS).get("CS3230")).toEqual(["Prerequisite planned too late: CS2040S"]);
    });

    it("warns about a prerequisite in the same term", () => {
        const mods = [mod("CS2040S", "Y1S2"), mod("CS3230", "Y1S2", "CS2040S")];
        expect(planWarnings(mods, NO_OFFERINGS).has("CS3230")).toBe(true);
    });

    it("accepts a prerequisite in an earlier term", () => {
        const mods = [mod("CS2040S", "Y1S1"), mod("CS3230", "Y1S2", "CS2040S")];
        expect(planWarnings(mods, NO_OFFERINGS).size).toBe(0);
    });

    it("accepts a late prerequisite that's already completed", () => {
        const mods = [mod("CS2040S", "Y2S1", undefined, { completed: true }), mod("CS3230", "Y1S2", "CS2040S")];
        expect(planWarnings(mods, NO_OFFERINGS).size).toBe(0);
    });

    it("accepts an OR when another option is in time", () => {
        const tree = { or: ["CS2040", "CS2040S"] };
        const mods = [mod("CS2040", "Y1S1"), mod("CS2040S", "Y3S1"), mod("CS3230", "Y2S1", tree)];
        expect(planWarnings(mods, NO_OFFERINGS).size).toBe(0);
    });

    it("counts n-of requirements", () => {
        const tree: PrereqTree = { nOf: [2, ["A1000", "B1000", "C1000"]] };
        const mods = [mod("A1000", "Y1S1"), mod("B1000", "Y3S1"), mod("X2000", "Y2S1", tree)];
        expect(planWarnings(mods, NO_OFFERINGS).get("X2000")).toEqual(["Prerequisite planned too late: B1000"]);
    });

    it("matches wildcards", () => {
        const mods = [mod("CS1010S", "Y2S1"), mod("CS2030", "Y1S1", "CS1010%:D")];
        expect(planWarnings(mods, NO_OFFERINGS).get("CS2030")).toEqual(["Prerequisite planned too late: CS1010S"]);
    });

    it("leaves prerequisites outside the plan to the graph", () => {
        expect(planWarnings([mod("CS3230", "Y1S2", "CS2040S")], NO_OFFERINGS).size).toBe(0);
    });

    it("doesn't treat a module with no term as late", () => {
        expect(planWarnings([mod("CS2040S"), mod("CS3230", "Y1S2", "CS2040S")], NO_OFFERINGS).size).toBe(0);
    });
});

describe("planWarnings: offerings", () => {
    it("warns when the semester doesn't match", () => {
        expect(planWarnings([mod("CS3233", "Y2S1")], offeredIn("CS3233", [2])).get("CS3233"))
            .toEqual(["Not offered in S1 this AY"]);
    });

    it("accepts a matching semester", () => {
        expect(planWarnings([mod("CS3233", "Y2S2")], offeredIn("CS3233", [2])).size).toBe(0);
    });

    it("skips the check until offerings have loaded", () => {
        expect(planWarnings([mod("CS3233", "Y2S1")], NO_OFFERINGS).size).toBe(0);
    });

    it("ignores modules with no term or already done", () => {
        const mods = [mod("CS3233"), mod("CS3230", "Y2S1", undefined, { completed: true })];
        expect(planWarnings(mods, offeredIn("CS1010", [1])).size).toBe(0);
    });
});

describe("groupByTerm", () => {
    it("orders terms, totals credits and puts no term last", () => {
        const groups = groupByTerm([mod("C"), mod("B", "Y2S1"), mod("A", "Y1S1"), mod("D", "Y1S1")], () => 4);
        expect(groups.map(group => group.term)).toEqual(["Y1S1", "Y2S1", null]);
        expect(groups[0].credits).toBe(8);
    });
});
