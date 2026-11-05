import { CURR_ACAD_YEAR } from "../constants";
import type { Mod } from "../types/types";
import type { Offerings } from "./offerings";

const REFRESH_CONCURRENCY = 4;
export const ACAD_YEAR_LABEL =`AY${CURR_ACAD_YEAR.replace('-20', '/')}`;
export const NOT_IN_CATALOGUE = `Not in the ${ACAD_YEAR_LABEL} catalogue`;

export class ModNotFoundError extends Error {
    constructor(code: string) {
        super(`${code} isn't in the ${ACAD_YEAR_LABEL} catalogue`);
        this.name = "ModNotFoundError";
    }
}

export async function fetchMod(code: string): Promise<Mod> {
    let res: Response;
    try {
        res = await fetch(
            `https://api.nusmods.com/v2/${CURR_ACAD_YEAR}/modules/${encodeURIComponent(code)}.json`
        );
    } catch {
        throw new Error("Couldn't reach NUSMods. Check your connection and try again.");
    }

    if (res.status === 404) {
        throw new ModNotFoundError(code);
    }
    if (!res.ok) {
        throw new Error("NUSMods returned an error. Try again later.");
    }
    const data = await res.json();
    return {
        code: data.moduleCode,
        title: data.title,
        completed:false,
        prereqTree: data.prereqTree,
        fulfillRequirements: data.fulfillRequirements
    }
}

export async function fetchOfferings(): Promise<Offerings> {
    const res = await fetch(`https://api.nusmods.com/v2/${CURR_ACAD_YEAR}/moduleList.json`);
    if (!res.ok) {
        throw new Error("Couldn't load the module list");
    }
    const list: { moduleCode: string; title: string; semesters: number[] }[] = await res.json();
    return new Map(list.map(({ moduleCode, title, semesters }) => [moduleCode, { title, semesters }]));
}

export function missingMod(code: string, completed: boolean): Mod {
    return { code, title: NOT_IN_CATALOGUE, completed };
}

/**
 * Re-fetches saved modules a few at a time. A module that's gone from the catalogue becomes a
 * missing one, and `complete` is false if any request failed, so it can be tried again later.
 */
export async function refreshCatalogue(mods: Mod[]): Promise<{ refreshed: Mod[]; complete: boolean }> {
    const queue = [...mods];
    const refreshed: Mod[] = [];
    let complete = true;

    const worker = async () => {
        for (let mod = queue.shift(); mod; mod = queue.shift()) {
            try {
                refreshed.push(await fetchMod(mod.code));
            } catch (err) {
                if (err instanceof ModNotFoundError) {
                    refreshed.push(missingMod(mod.code, mod.completed));
                }
                else {
                    complete = false;
                }
            }
        }
    };
    await Promise.all(Array.from({ length: REFRESH_CONCURRENCY }, worker));

    return { refreshed, complete };
}
