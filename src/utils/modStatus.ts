import type { Mod } from "../types/types";

export type ModStatus = "planned" | "taking" | "done";

/** A module being taken now counts as met when planning what comes after it. */
export const isDone = (mod: Mod) => mod.completed || !!mod.taking;

export function statusOf(mod: Mod): ModStatus {
    if (mod.completed) {
        return "done";
    }
    return mod.taking ? "taking" : "planned";
}

export const withStatus = (mod: Mod, status: ModStatus): Mod => ({
    ...mod,
    completed: status === "done",
    taking: status === "taking",
});
