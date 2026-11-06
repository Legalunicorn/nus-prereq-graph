import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Mod } from "../types/types";

const UNDO_WINDOW_MS = 6000;

export const removalLabel = (removed: Mod[]) =>
    removed.length === 1 ? `Removed ${removed[0].code}` : `Removed ${removed.length} modules`;

/** Adds back whatever isn't in the plan, so anything added since the removal stays. */
export function restoreMods(current: Mod[], removed: Mod[]) {
    const codes = new Set(current.map(mod => mod.code));
    return [...current, ...removed.filter(mod => !codes.has(mod.code))];
}

export default function useUndoableRemoval(mods: Mod[], setMods: Dispatch<SetStateAction<Mod[]>>) {
    const [removed, setRemoved] = useState<Mod[]>([]);

    useEffect(() => {
        if (removed.length === 0) {
            return;
        }
        const timer = setTimeout(() => setRemoved([]), UNDO_WINDOW_MS);
        return () => clearTimeout(timer);
    }, [removed]);

    const removeWhere = (isRemoved: (mod: Mod) => boolean) => {
        setRemoved(prev => [...prev, ...mods.filter(isRemoved)]);
        setMods(prev => prev.filter(mod => !isRemoved(mod)));
    };

    return {
        removed,
        remove: (code: string) => removeWhere(mod => mod.code === code),
        clear: () => removeWhere(() => true),
        undo: () => {
            setMods(prev => restoreMods(prev, removed));
            setRemoved([]);
        },
        dismiss: () => setRemoved([]),
    };
}
