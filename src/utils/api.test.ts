import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mod } from "../types/types";
import { fetchMod, missingMod, ModNotFoundError, refreshCatalogue } from "./api";

function stubFetch(response: Partial<Response> | Error) {
    const fetchStub = response instanceof Error
        ? vi.fn().mockRejectedValue(response)
        : vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchStub);
    return fetchStub;
}

describe("fetchMod", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("maps a module from the API", async () => {
        stubFetch({
            ok: true,
            json: async () => ({ moduleCode: "CS3230", title: "Algorithms", prereqTree: "CS2040S:D" }),
        });
        await expect(fetchMod("CS3230")).resolves.toMatchObject({
            code: "CS3230",
            title: "Algorithms",
            completed: false,
            prereqTree: "CS2040S:D",
        });
    });

    it("throws ModNotFoundError on a 404", async () => {
        stubFetch({ ok: false, status: 404 });
        await expect(fetchMod("CS2010")).rejects.toBeInstanceOf(ModNotFoundError);
    });

    it("does not treat a server error as not found", async () => {
        stubFetch({ ok: false, status: 500 });
        const error = await fetchMod("CS3230").catch(err => err);
        expect(error).toBeInstanceOf(Error);
        expect(error).not.toBeInstanceOf(ModNotFoundError);
    });

    it("does not treat a network failure as not found", async () => {
        stubFetch(new TypeError("Failed to fetch"));
        const error = await fetchMod("CS3230").catch(err => err);
        expect(error).not.toBeInstanceOf(ModNotFoundError);
        expect(error.message).toContain("NUSMods");
    });

    it("encodes the code in the URL", async () => {
        const fetchStub = stubFetch({ ok: false, status: 404 });
        await fetchMod("CS1010%").catch(() => {});
        expect(fetchStub.mock.calls[0][0]).toContain("CS1010%25.json");
    });
});

describe("refreshCatalogue", () => {
    afterEach(() => vi.unstubAllGlobals());

    const saved = (code: string): Mod => ({ code, title: "Old title", completed: true });

    it("updates every module", async () => {
        stubFetch({ ok: true, json: async () => ({ moduleCode: "CS1", title: "New title" }) });
        const { refreshed, complete } = await refreshCatalogue([saved("CS1")]);
        expect(complete).toBe(true);
        expect(refreshed[0].title).toBe("New title");
    });

    it("turns a module that has left the catalogue into a missing one", async () => {
        stubFetch({ ok: false, status: 404 });
        const { refreshed, complete } = await refreshCatalogue([saved("CS2010")]);
        expect(complete).toBe(true);
        expect(refreshed).toEqual([missingMod("CS2010", true)]);
    });

    it("reports incomplete and leaves out modules that failed", async () => {
        stubFetch(new TypeError("Failed to fetch"));
        const { refreshed, complete } = await refreshCatalogue([saved("CS1")]);
        expect(complete).toBe(false);
        expect(refreshed).toEqual([]);
    });
});

describe("missingMod", () => {
    it("creates a module with no prerequisites", () => {
        const mod = missingMod("CS2010", true);
        expect(mod).toMatchObject({ code: "CS2010", completed: true });
        expect(mod.prereqTree).toBeUndefined();
    });
});
