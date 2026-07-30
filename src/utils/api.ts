import type { Mod } from "../types/types";

const CURRENT_ACAD_YEAR = '2026-2027';

export async function fetchMod(code: string): Promise<Mod> {
    const res = await fetch(
        'https://api.nusmods.com/v2/${CURRENT_ACAD_YEAR}/modules/${code}.json'
    );

    if (!res.ok) throw new Error('Mod not found?');
    const data = await res.json();
    return {
        code: data.moduleCode,
        title: data.title,
        completed:false,
        prereqTree: data.prereqTree
    }
}