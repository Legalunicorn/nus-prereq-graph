import type { Mod } from "../types/types";

const OTHER_LABEL = "Other";

const levelOf = (code: string) => {
    const digit = code.match(/\d/)?.[0];
    return digit ? Number(digit) * 1000 : Infinity;
};

/** Groups by the level in each module's code, lowest first, sorting by code within a level. */
export function groupByLevel(mods: Mod[]) {
    const sorted = [...mods].sort((a, b) => levelOf(a.code) - levelOf(b.code) || a.code.localeCompare(b.code));
    const levels = [...new Set(sorted.map(mod => levelOf(mod.code)))];
    return levels.map(level => ({
        label: level === Infinity ? OTHER_LABEL : `${level} level`,
        mods: sorted.filter(mod => levelOf(mod.code) === level),
    }));
}
