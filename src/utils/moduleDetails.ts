import { CURR_ACAD_YEAR } from "../constants";
import { FOCUS_AREAS } from "../data/focusAreas";

export interface ModuleDetails {
    title: string;
    moduleCredit: string;
    prerequisite?: string;
    corequisite?: string;
    preclusion?: string;
    preclusionRule?: string;
    fulfillRequirements: string[];
}

const cache = new Map<string, Promise<ModuleDetails | null>>();

async function requestDetails(code: string): Promise<ModuleDetails | null> {
    const res = await fetch(`https://api.nusmods.com/v2/${CURR_ACAD_YEAR}/modules/${encodeURIComponent(code)}.json`);
    if (res.status === 404) {
        return null;
    }
    if (!res.ok) {
        throw new Error("Couldn't load module details");
    }
    const data = await res.json();
    return { ...data, fulfillRequirements: data.fulfillRequirements ?? [] };
}

export function fetchDetails(code: string): Promise<ModuleDetails | null> {
    const cached = cache.get(code);
    if (cached) {
        return cached;
    }
    const request = requestDetails(code).catch(err => {
        cache.delete(code);
        throw err;
    });
    cache.set(code, request);
    return request;
}

/** Removes the boilerplate NUSMods puts around every requirement. */
export function cleanRequirement(text: string): string {
    return text
        .replace(/^\s*if undertaking an undergraduate degree\s*then\s*/i, "")
        .replace(/\s+/g, " ")
        .replace(/(\S)(AND|OR)(must)/g, "$1 $2 $3")
        .trim()
        .replace(/^\(\s*(.*?)\s*\)$/, "$1");
}

export function codesIn(rule: string | undefined): string[] {
    return [...new Set(rule?.match(/\b[A-Z]{2,4}\d{4}[A-Z]{0,3}\b/g) ?? [])];
}

export function focusAreasFor(code: string) {
    return FOCUS_AREAS.flatMap(area => {
        if (area.primaries.some(course => course.code === code)) {
            return [`${area.name} (primary)`];
        }
        return area.electives.some(course => course.code === code) ? [area.name] : [];
    });
}
