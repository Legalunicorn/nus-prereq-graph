import type { Mod } from "../types/types";

/** A module being taken now counts as met when planning what comes after it. */
export const isDone = (mod: Mod) => mod.completed || !!mod.taking;
