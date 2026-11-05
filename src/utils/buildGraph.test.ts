import { describe, expect, it } from "vitest";
import type { Graph, Node } from "../types/graph";
import type { Mod, PrereqTree } from "../types/types";
import { buildGraph } from "./buildGraph";

function mod(code: string, prereqTree?: PrereqTree, completed = false): Mod {
    return { code, title: code, completed, prereqTree };
}

function moduleNode(graph: Graph, code: string) {
    const node = graph.nodes.get(code);
    if (node?.kind !== "module") throw new Error(`${code} is not a module node`);
    return node;
}

function gates(graph: Graph) {
    return [...graph.nodes.values()].filter(
        (node): node is Extract<Node, { kind: "gate" }> => node.kind === "gate"
    );
}

function moduleCodes(graph: Graph) {
    return [...graph.nodes.values()]
        .filter(node => node.kind === "module")
        .map(node => node.id)
        .sort();
}

// Real trees from the NUSMods API, AY2026/27.
const CS5234: PrereqTree = "CS3230:D";
const CS2030S: PrereqTree = { or: ["CS1010:D", "CS1101S:D", "CS1010S:D"] };
const CS3230: PrereqTree = {
    and: [
        { or: ["CS2040S:D", "CS2040:D", "CS2040C:D"] },
        { or: ["CS1231S:D", "CS1231:D"] },
    ],
};

describe("buildGraph", () => {
    it("returns an empty graph with no modules", () => {
        const graph = buildGraph([]);
        expect(graph.nodes.size).toBe(0);
        expect(graph.edges).toEqual([]);
    });

    it("adds a tracked module with no prerequisites and no edges", () => {
        const graph = buildGraph([mod("CS1101S")]);
        expect(moduleNode(graph, "CS1101S")).toMatchObject({ tracked: true, completed: false });
        expect(moduleNode(graph, "CS1101S").prereqUnfulfilled).toBeUndefined();
        expect(graph.edges).toEqual([]);
    });

    describe("single-module prerequisite", () => {
        it("links the prerequisite directly and keeps its minimum grade", () => {
            const graph = buildGraph([mod("CS5234", CS5234)]);
            expect(gates(graph)).toEqual([]);
            expect(graph.edges).toEqual([{ from: "CS3230", to: "CS5234", minGrade: "D" }]);
            expect(moduleNode(graph, "CS3230").tracked).toBe(false);
            expect(moduleNode(graph, "CS5234").prereqUnfulfilled).toBe(true);
        });

        it("is fulfilled when the prerequisite is completed", () => {
            const graph = buildGraph([mod("CS5234", CS5234), mod("CS3230", undefined, true)]);
            expect(moduleNode(graph, "CS5234").prereqUnfulfilled).toBe(false);
        });

        it("is not fulfilled when the prerequisite is only tracked", () => {
            const graph = buildGraph([mod("CS5234", CS5234), mod("CS3230")]);
            expect(moduleNode(graph, "CS5234").prereqUnfulfilled).toBe(true);
        });
    });

    describe("or gates", () => {
        it("is unfulfilled and shows every alternative when none is completed", () => {
            const graph = buildGraph([mod("CS2030S", CS2030S)]);
            expect(gates(graph)).toMatchObject([{ gateType: "or", fulfilled: false }]);
            expect(moduleCodes(graph)).toEqual(["CS1010", "CS1010S", "CS1101S", "CS2030S"]);
        });

        it("hides untaken, untracked alternatives once fulfilled", () => {
            const graph = buildGraph([mod("CS2030S", CS2030S), mod("CS1101S", undefined, true)]);
            expect(gates(graph)).toMatchObject([{ gateType: "or", fulfilled: true }]);
            expect(moduleCodes(graph)).toEqual(["CS1101S", "CS2030S"]);
            expect(moduleNode(graph, "CS2030S").prereqUnfulfilled).toBe(false);
        });

        it("keeps a tracked alternative as a node but drops its edge once fulfilled", () => {
            const graph = buildGraph([
                mod("CS2030S", CS2030S),
                mod("CS1101S", undefined, true),
                mod("CS1010"),
            ]);
            expect(moduleCodes(graph)).toEqual(["CS1010", "CS1101S", "CS2030S"]);
            expect(graph.edges.some(edge => edge.from === "CS1010")).toBe(false);
        });
    });

    describe("and gates", () => {
        it("needs every branch to be fulfilled", () => {
            const graph = buildGraph([mod("CS3230", CS3230), mod("CS2040S", undefined, true)]);
            expect(moduleNode(graph, "CS3230").prereqUnfulfilled).toBe(true);
            const and = gates(graph).find(gate => gate.gateType === "and");
            expect(and?.fulfilled).toBe(false);
        });

        it("is fulfilled when every branch is", () => {
            const graph = buildGraph([
                mod("CS3230", CS3230),
                mod("CS2040S", undefined, true),
                mod("CS1231S", undefined, true),
            ]);
            expect(moduleNode(graph, "CS3230").prereqUnfulfilled).toBe(false);
            expect(gates(graph).every(gate => gate.fulfilled)).toBe(true);
        });

        it("keeps showing unfinished children under a fulfilled branch of an and", () => {
            const tree: PrereqTree = { and: ["A1:D", "B1:D"] };
            const graph = buildGraph([mod("X1", tree), mod("A1", undefined, true)]);
            expect(moduleCodes(graph)).toEqual(["A1", "B1", "X1"]);
        });
    });

    describe("nOf gates", () => {
        const tree: PrereqTree = { nOf: [2, ["A1:D", "B1:D", "C1:D"]] };

        it("is unfulfilled below n", () => {
            const graph = buildGraph([mod("X1", tree), mod("A1", undefined, true)]);
            expect(gates(graph)).toMatchObject([{ gateType: "nOf", n: 2, fulfilled: false }]);
            expect(moduleNode(graph, "X1").prereqUnfulfilled).toBe(true);
        });

        it("is fulfilled at n and hides the rest", () => {
            const graph = buildGraph([
                mod("X1", tree),
                mod("A1", undefined, true),
                mod("B1", undefined, true),
            ]);
            expect(gates(graph)).toMatchObject([{ gateType: "nOf", fulfilled: true }]);
            expect(moduleCodes(graph)).toEqual(["A1", "B1", "X1"]);
        });
    });

    it("shares one node when two modules need the same prerequisite", () => {
        const graph = buildGraph([mod("CS5234", CS5234), mod("CS5237", "CS3230:D")]);
        expect(moduleCodes(graph)).toEqual(["CS3230", "CS5234", "CS5237"]);
        expect(graph.edges.filter(edge => edge.from === "CS3230")).toHaveLength(2);
    });

    it("keeps tracked data when a tracked module is also a prerequisite", () => {
        const graph = buildGraph([mod("CS5234", CS5234), { ...mod("CS3230"), title: "Algorithms" }]);
        expect(moduleNode(graph, "CS3230")).toMatchObject({ tracked: true, title: "Algorithms" });
    });
});
