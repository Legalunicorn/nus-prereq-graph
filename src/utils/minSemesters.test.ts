import { describe, expect, it } from "vitest";
import type { PrereqTree } from "../types/types";
import { createEstimator, nextSemester } from "./minSemesters";
import type { RegularSemester } from "./minSemesters";
import type { SnapshotModule } from "./snapshot";

const mod = (semesters: number[], prereqTree?: PrereqTree): SnapshotModule => ({ title: "T", semesters, prereqTree });

const modules: Record<string, SnapshotModule> = {
    A1: mod([1, 2]),
    B1: mod([1, 2], "A1:D"),
    C1: mod([1, 2], { and: ["A1:D", "B1:D"] }),
    OR1: mod([1, 2], { or: ["A1:D", "C1:D"] }),
    NOF: mod([1, 2], { nOf: [2, ["A1:D", "B1:D", "C1:D"]] }),
    ONLY_S1: mod([1]),
    ONLY_S2: mod([2], "B1:D"),
    AFTER_S1: mod([1], "ONLY_S1:D"),
    NEVER: mod([]),
    NEEDS_NEVER: mod([1, 2], "NEVER:D"),
    ST_ONLY: mod([3]),
    NEEDS_RETIRED: mod([1, 2], "GONE:D"),
    WILD: mod([1, 2], "A%:D"),
    MATHS: mod([1, 2], { or: ["MA1301:D", "MA1301X:D"] }),
    CONDITION: mod([1, 2], { cohort: { rule: "MUST_BE_IN", years: ["S:2021/22"] } }),
    CYCLE1: mod([1, 2], "CYCLE2:D"),
    CYCLE2: mod([1, 2], "CYCLE1:D"),
};

const estimate = (code: string, completed: string[] = [], start: RegularSemester = 1) =>
    createEstimator({ modules, completed: new Set(completed), start })(code);

describe("createEstimator", () => {
    it.each([
        ["A1", 1],
        ["B1", 2],
        ["C1", 3],
        ["OR1", 2],
        ["NOF", 3],
    ])("gives %s a minimum of %i semesters", (code, semesters) => {
        expect(estimate(code)).toBe(semesters);
    });

    it("counts completed modules as done", () => {
        expect(estimate("A1", ["A1"])).toBe(0);
        expect(estimate("C1", ["A1", "B1"])).toBe(1);
    });

    it("waits for a semester the module is offered in", () => {
        expect(estimate("ONLY_S1", [], 1)).toBe(1);
        expect(estimate("ONLY_S1", [], 2)).toBe(2);
        expect(estimate("ONLY_S2", [], 1)).toBe(4);
        expect(estimate("ONLY_S2", [], 2)).toBe(3);
    });

    it("waits a full year between two modules in the same semester", () => {
        expect(estimate("AFTER_S1", [], 1)).toBe(3);
    });

    it("returns null when a module can't be reached", () => {
        expect(estimate("NEVER")).toBeNull();
        expect(estimate("NEEDS_NEVER")).toBeNull();
        expect(estimate("ST_ONLY")).toBeNull();
        expect(estimate("NEEDS_RETIRED")).toBeNull();
        expect(estimate("NOT_IN_SNAPSHOT")).toBeNull();
    });

    it("lets a completed retired module satisfy a prerequisite", () => {
        expect(estimate("NEEDS_RETIRED", ["GONE"])).toBe(1);
    });

    it("matches wildcards", () => {
        expect(estimate("WILD")).toBe(2);
    });

    it("assumes MA1301 isn't required", () => {
        expect(estimate("MATHS")).toBe(1);
    });

    it("ignores non-course conditions", () => {
        expect(estimate("CONDITION")).toBe(1);
    });

    it("returns null for a cycle", () => {
        expect(estimate("CYCLE1")).toBeNull();
    });
});

describe("nextSemester", () => {
    it("is Sem 2 from August and Sem 1 before that", () => {
        expect(nextSemester(new Date(2026, 10, 6))).toBe(2);
        expect(nextSemester(new Date(2026, 7, 1))).toBe(2);
        expect(nextSemester(new Date(2027, 0, 15))).toBe(1);
        expect(nextSemester(new Date(2027, 6, 31))).toBe(1);
    });
});
