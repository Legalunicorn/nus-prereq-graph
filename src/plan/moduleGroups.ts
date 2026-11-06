import type { Mod } from "../types/types";
import { statusOf } from "./modStatus";
import type { ModStatus } from "./modStatus";
import { groupByTerm } from "./semesterPlan";

export const GROUP_OPTIONS = { level: "Level", status: "Status", term: "Term" } as const;
export type GroupBy = keyof typeof GROUP_OPTIONS;

export interface ModGroup {
    id: string;
    label: string;
    mods: Mod[];
    /** Only term groups show credits, as loading them for every module would mean a request each. */
    credits?: number;
}

const OTHER_LABEL = "Other";
const STATUS_LABELS: [ModStatus, string][] = [["taking", "Taking"], ["planned", "Planned"], ["done", "Done"]];

const byCode = (mods: Mod[]) => [...mods].sort((a, b) => a.code.localeCompare(b.code));

const levelOf = (code: string) => {
    const digit = code.match(/\d/)?.[0];
    return digit ? Number(digit) * 1000 : Infinity;
};

function groupByLevel(mods: Mod[]): ModGroup[] {
    const levels = [...new Set(mods.map(mod => levelOf(mod.code)))].sort((a, b) => a - b);
    return levels.map(level => {
        const label = level === Infinity ? OTHER_LABEL : `${level} level`;
        return { id: label, label, mods: mods.filter(mod => levelOf(mod.code) === level) };
    });
}

const groupByStatus = (mods: Mod[]): ModGroup[] => STATUS_LABELS
    .map(([status, label]) => ({ id: status, label, mods: mods.filter(mod => statusOf(mod) === status) }))
    .filter(group => group.mods.length > 0);

/** Groups modules in a fixed order, sorted by code within each group. */
export function groupMods(mods: Mod[], by: GroupBy, creditsOf: (code: string) => number): ModGroup[] {
    const sorted = byCode(mods);
    if (by === "level") {
        return groupByLevel(sorted);
    }
    if (by === "status") {
        return groupByStatus(sorted);
    }
    return groupByTerm(sorted, creditsOf).map(({ term, mods: inTerm, credits }) => ({
        id: term ?? "none",
        label: term ?? "No term",
        mods: inTerm,
        credits: term ? credits : undefined,
    }));
}
