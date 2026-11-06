import { describe, expect, it } from "vitest";
import type { Mod } from "../types/types";
import { decodePlan, encodePlan } from "./sharePlan";

const mods: Mod[] = [
    { code: "CS1231S", title: "A", completed: true },
    { code: "CS2040S", title: "B", completed: false, taking: true },
    { code: "CS3230", title: "C", completed: false },
];

describe("sharePlan", () => {
    it("encodes codes and statuses compactly", () => {
        expect(encodePlan(mods)).toBe("#plan=CS1231S.c,CS2040S.t,CS3230");
    });

    it("round-trips a plan", () => {
        expect(decodePlan(encodePlan(mods))).toEqual([
            { code: "CS1231S", completed: true, taking: false },
            { code: "CS2040S", completed: false, taking: true },
            { code: "CS3230", completed: false, taking: false },
        ]);
    });

    it("returns null without a plan", () => {
        expect(decodePlan("")).toBeNull();
        expect(decodePlan("#other=1")).toBeNull();
        expect(decodePlan("#plan=")).toBeNull();
    });

    it("drops invalid codes and duplicates", () => {
        expect(decodePlan("#plan=CS3230,../x,CS3230,<b>")).toEqual([
            { code: "CS3230", completed: false, taking: false },
        ]);
    });
});
