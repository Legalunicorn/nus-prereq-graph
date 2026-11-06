import { describe, expect, it } from "vitest";
import type { Mod, PrereqTree } from "../types/types";
import { buildGraph } from "./buildGraph";
import { hideCompleted } from "./hideCompleted";

const mod = (code: string, prereqTree?: PrereqTree, status: Partial<Mod> = {}): Mod => ({
    code,
    title: code,
    completed: false,
    prereqTree,
    ...status,
});

const visibleIds = (mods: Mod[]) => [...hideCompleted(buildGraph(mods)).nodes.keys()];

describe("hideCompleted", () => {
    it("removes completed modules and keeps what they unlocked", () => {
        const ids = visibleIds([mod("A1", undefined, { completed: true }), mod("B1", "A1:D")]);
        expect(ids).toEqual(["B1"]);
    });

    it("removes a gate the completed modules satisfied", () => {
        const tree = { and: ["A1:D", "B1:D"] };
        const done = { completed: true };
        const ids = visibleIds([mod("A1", undefined, done), mod("B1", undefined, done), mod("C1", tree)]);
        expect(ids).toEqual(["C1"]);
    });

    it("keeps a gate with a requirement still unmet", () => {
        const tree = { and: ["A1:D", "B1:D"] };
        const ids = visibleIds([mod("A1", undefined, { completed: true }), mod("B1"), mod("C1", tree)]);
        expect(ids).toContain("B1");
        expect(ids).toContain("gate:C1");
        expect(ids).not.toContain("A1");
    });

    it("keeps modules being taken, and the gates they satisfy", () => {
        const tree = { or: ["A1:D", "B1:D"] };
        const ids = visibleIds([mod("A1", undefined, { taking: true }), mod("C1", tree)]);
        expect(ids).toContain("A1");
        expect(ids).toContain("gate:C1");
    });
});
