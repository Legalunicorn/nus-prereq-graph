import type { Mod } from "../types/types";
import { CURR_ACAD_YEAR, STORAGE_KEY } from "../constants";

// Bump this and migrate in parseStored when the saved format changes.
// Data saved before versioning has no version field and the same shape as version 1.
const STORAGE_VERSION = 1;

export interface StorageData {
    version: number;
    acadYear: string;
    mods: Mod[];
}

const isMod = (value: unknown): value is Mod => {
    const mod = value as Partial<Mod> | null;
    return typeof mod?.code === "string"
        && typeof mod.title === "string"
        && typeof mod.completed === "boolean";
};

/** `acadYear` is the year the saved catalogue data came from, which may be older than the current one. */
export function parseStored(json: string | null): StorageData {
    const empty = { version: STORAGE_VERSION, acadYear: CURR_ACAD_YEAR, mods: [] };
    if (!json) {
        return empty;
    }
    try {
        const data: Partial<StorageData> | null = JSON.parse(json);
        if (!Array.isArray(data?.mods)) {
            return empty;
        }
        return {
            version: STORAGE_VERSION,
            acadYear: data.acadYear ?? CURR_ACAD_YEAR,
            mods: data.mods.filter(isMod),
        };
    } catch {
        console.warn("Could not read the saved module list");
        return empty;
    }
}

export function loadStored(): StorageData {
    try {
        return parseStored(localStorage.getItem(STORAGE_KEY));
    } catch {
        console.warn("Could not access local storage");
        return parseStored(null);
    }
}

export function saveMods(mods: Mod[], acadYear: string) {
    const data: StorageData = { version: STORAGE_VERSION, acadYear, mods };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        console.warn("Could not save the module list");
    }
}
