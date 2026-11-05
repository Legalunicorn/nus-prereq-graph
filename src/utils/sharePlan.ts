import type { Mod } from "../types/types";

const HASH_PREFIX = "#plan=";
const COMPLETED_SUFFIX = ".c";
const TAKING_SUFFIX = ".t";
const VALID_CODE = /^[A-Z0-9]+$/;

export type SharedMod = Pick<Mod, "code" | "completed" | "taking">;

export function encodePlan(mods: Mod[]): string {
    const entries = mods.map(mod => {
        if (mod.completed) {
            return `${mod.code}${COMPLETED_SUFFIX}`;
        }
        return mod.taking ? `${mod.code}${TAKING_SUFFIX}` : mod.code;
    });
    return `${HASH_PREFIX}${entries.join(",")}`;
}

/** Returns the plan in a URL hash, or null if there isn't a valid one. */
export function decodePlan(hash: string): SharedMod[] | null {
    if (!hash.startsWith(HASH_PREFIX)) {
        return null;
    }
    const plan = hash.slice(HASH_PREFIX.length).split(",").map(entry => {
        const [code, status] = entry.split(".");
        return { code, completed: `.${status}` === COMPLETED_SUFFIX, taking: `.${status}` === TAKING_SUFFIX };
    }).filter(mod => VALID_CODE.test(mod.code));
    const unique = [...new Map(plan.map(mod => [mod.code, mod])).values()];
    return unique.length > 0 ? unique : null;
}
