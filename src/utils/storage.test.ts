import { afterEach, describe, expect, it, vi } from "vitest";
import { CURR_ACAD_YEAR, STORAGE_KEY } from "../constants";
import type { Mod } from "../types/types";
import { isFirstVisit, loadStored, parseStored, saveMods } from "./storage";

const mod: Mod = { code: "CS3230", title: "Algorithms", completed: true };

describe("parseStored", () => {
    it("returns an empty list for the current year when nothing is saved", () => {
        expect(parseStored(null)).toMatchObject({ acadYear: CURR_ACAD_YEAR, mods: [] });
    });

    it("keeps the plan and reports the old year when saved in an earlier AY", () => {
        const stored = parseStored(JSON.stringify({ acadYear: "2025-2026", mods: [mod] }));
        expect(stored.mods).toEqual([mod]);
        expect(stored.acadYear).toBe("2025-2026");
    });

    it("reads data saved before versioning", () => {
        const stored = parseStored(JSON.stringify({ acadYear: CURR_ACAD_YEAR, mods: [mod] }));
        expect(stored.mods).toEqual([mod]);
        expect(stored.version).toBe(1);
    });

    it("returns an empty list for invalid JSON", () => {
        vi.spyOn(console, "warn").mockImplementation(() => {});
        expect(parseStored("{not json").mods).toEqual([]);
    });

    it("returns an empty list when mods isn't an array or the data is null", () => {
        expect(parseStored(JSON.stringify({ mods: 5 })).mods).toEqual([]);
        expect(parseStored("null").mods).toEqual([]);
    });

    it("drops malformed entries and keeps the rest", () => {
        const stored = parseStored(JSON.stringify({ mods: [mod, null, { code: "CS1010" }, 5] }));
        expect(stored.mods).toEqual([mod]);
    });
});

describe("saveMods", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("round-trips through local storage", () => {
        const store = new Map<string, string>();
        vi.stubGlobal("localStorage", {
            getItem: (key: string) => store.get(key) ?? null,
            setItem: (key: string, value: string) => store.set(key, value),
        });
        saveMods([mod], "2025-2026");
        expect(store.has(STORAGE_KEY)).toBe(true);
        expect(loadStored()).toEqual({ version: 1, acadYear: "2025-2026", mods: [mod] });
    });

    it("does not throw when storage is full or blocked", () => {
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.stubGlobal("localStorage", {
            setItem: () => { throw new Error("QuotaExceededError"); },
        });
        expect(() => saveMods([mod], CURR_ACAD_YEAR)).not.toThrow();
    });

    it("loads an empty list when storage can't be read", () => {
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.stubGlobal("localStorage", {
            getItem: () => { throw new Error("SecurityError"); },
        });
        expect(loadStored().mods).toEqual([]);
    });
});

describe("isFirstVisit", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("is true only when nothing has been saved", () => {
        vi.stubGlobal("localStorage", { getItem: () => null });
        expect(isFirstVisit()).toBe(true);
        vi.stubGlobal("localStorage", { getItem: () => "{\"mods\":[]}" });
        expect(isFirstVisit()).toBe(false);
    });

    it("is false when storage is unavailable", () => {
        vi.stubGlobal("localStorage", { getItem: () => { throw new Error("blocked"); } });
        expect(isFirstVisit()).toBe(false);
    });
});
