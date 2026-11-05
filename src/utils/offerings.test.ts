import { describe, expect, it } from "vitest";
import { isOffered, NOT_OFFERED, semesterLabel } from "./offerings";

const offerings = new Map<string, number[]>([
    ["BOTH", [1, 2]],
    ["ONE", [2]],
    ["WITH_ST", [1, 2, 4]],
    ["ONLY_ST", [3]],
    ["EMPTY", []],
]);

describe("semesterLabel", () => {
    it.each([
        ["BOTH", "S1·S2"],
        ["ONE", "S2"],
        ["WITH_ST", "S1·S2·ST"],
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
