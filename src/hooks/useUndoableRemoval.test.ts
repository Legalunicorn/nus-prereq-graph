import { describe, expect, it } from "vitest";
import type { Mod } from "../types/types";
import { removalLabel, restoreMods } from "./useUndoableRemoval";

const mod = (code: string, status: Partial<Mod> = {}): Mod => ({ code, title: code, completed: false, ...status });

describe("removalLabel", () => {
    it("names a single module and counts several", () => {
        expect(removalLabel([mod("CS3230")])).toBe("Removed CS3230");
        expect(removalLabel([mod("A1"), mod("B1")])).toBe("Removed 2 modules");
    });
});

describe("restoreMods", () => {
    it("brings modules back with their status and term", () => {
        const removed = mod("A1", { completed: true, plannedTerm: "Y1S1" });
        expect(restoreMods([], [removed])).toEqual([removed]);
    });

    it("keeps what was added since and doesn't duplicate", () => {
        const codes = restoreMods([mod("B1"), mod("A1")], [mod("A1"), mod("C1")]).map(({ code }) => code);
        expect(codes).toEqual(["B1", "A1", "C1"]);
    });
});
