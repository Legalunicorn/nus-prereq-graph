import { describe, expect, it } from "vitest";
import type { Mod, PrereqTree } from "../types/types";
import { buildGraph } from "./buildGraph";
import { tagLabel, toElements } from "./graphElements";

function mod(code: string, prereqTree?: PrereqTree, completed = false): Mod {
    return { code, title: code, completed, prereqTree };
}

const ids = (mods: Mod[]) => toElements(buildGraph(mods)).map(element => element.data.id);

describe("tagLabel", () => {
    it("joins semesters and the minimum", () => {
        expect(tagLabel("S2", 3)).toBe("S2 · min 3 sems");
    });

    it("shows only the minimum for a module in both semesters", () => {
        expect(tagLabel("", 1)).toBe("min 1 sem");
    });

    it("leaves out the minimum when it's unknown or already done", () => {
        expect(tagLabel("S1", null)).toBe("S1");
        expect(tagLabel("S1", 0)).toBe("S1");
    });

    it("is empty when there's nothing to show", () => {
        expect(tagLabel("", null)).toBe("");
    });
});

describe("toElements", () => {
    const tree: PrereqTree = { and: [{ or: ["A1:D", "B1:D"] }, "C1:D"] };

    it("gives the same IDs when the same graph is built twice", () => {
        expect(ids([mod("X1", tree)])).toEqual(ids([mod("X1", tree)]));
    });

    it("gives each module's gates their own IDs", () => {
        const all = ids([mod("X1", tree), mod("Y1", tree)]);
        expect(new Set(all).size).toBe(all.length);
        expect(all).toContain("gate:X1");
        expect(all).toContain("gate:Y1");
    });

    it("merges a prerequisite listed twice under one gate into one edge", () => {
        const all = ids([mod("X1", { or: ["A1:D", "A1:D"] })]);
        expect(all.filter(id => id === "A1->gate:X1")).toHaveLength(1);
    });

    it("always sets boolean status fields", () => {
        const [element] = toElements(buildGraph([mod("X1")]));
        expect(element.data).toMatchObject({ completed: false, tracked: true, prereqUnfulfilled: false });
    });

    it("adds the semesters once offerings are known", () => {
        const offerings = new Map([["X1", { title: "X", semesters: [2] }]]);
        const [element] = toElements(buildGraph([mod("X1")]), offerings);
        expect(element.data).toMatchObject({ label: "X1", tag: "S2", notOffered: false });
    });

    it("marks a module missing from the offerings as not offered", () => {
        const [element] = toElements(buildGraph([mod("X1")]), new Map());
        expect(element.data).toMatchObject({ label: "X1", tag: "Not offered", notOffered: true });
    });

    it("has no semesters before offerings load", () => {
        const [element] = toElements(buildGraph([mod("X1")]));
        expect(element.data).toMatchObject({ label: "X1", tag: "", notOffered: false });
    });

    it("marks completed modules with a tick", () => {
        const elements = toElements(buildGraph([mod("X1", "A1:D"), mod("A1", undefined, true)]));
        expect(elements.find(element => element.data.id === "A1")?.data).toMatchObject({ label: "✓ A1" });
    });

    it("shows wildcards with a star and no semesters", () => {
        const elements = toElements(buildGraph([mod("X1", "CS1010%:D")]), new Map());
        expect(elements.find(element => element.data.id === "CS1010%")?.data).toMatchObject({
            label: "CS1010*",
            wildcard: true,
            notOffered: false,
        });
    });

    it("labels only unusual minimum grades", () => {
        const elements = toElements(buildGraph([mod("X1", { and: ["A1:A-", "B1:D"] })]));
        const edge = (id: string) => elements.find(element => element.data.id === id)?.data;
        expect(edge("A1->gate:X1")).toMatchObject({ gradeLabel: "A-" });
        expect(edge("B1->gate:X1")).toMatchObject({ gradeLabel: "" });
    });

    it("labels nOf gates with n", () => {
        const elements = toElements(buildGraph([mod("X1", { nOf: [2, ["A1:D", "B1:D"]] })]));
        expect(elements.find(element => element.data.id === "gate:X1")?.data).toMatchObject({ label: "2 OF" });
    });
});
