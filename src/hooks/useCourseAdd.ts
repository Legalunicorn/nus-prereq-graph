import { useState } from "react";
import type { Mod } from "../types/types";
import { fetchMod, ModNotFoundError } from "../utils/api";

export default function useCourseAdd(mods: Mod[], onAdd: (mod: Mod) => void) {
    const [loadingCode, setLoadingCode] = useState<string | null>(null);
    const [errorCode, setErrorCode] = useState<string | null>(null);
    const [unavailable, setUnavailable] = useState<ReadonlySet<string>>(new Set());
    const trackedCodes = new Set(mods.map(mod => mod.code));

    const addCourse = async (code: string) => {
        if (trackedCodes.has(code)) return;
        setLoadingCode(code);
        setErrorCode(null);
        try {
            onAdd(await fetchMod(code));
        } catch (err) {
            if (err instanceof ModNotFoundError) {
                setUnavailable(prev => new Set(prev).add(code));
            } else {
                setErrorCode(code);
            }
        } finally {
            setLoadingCode(null);
        }
    };

    const rowProps = (code: string) => ({
        tracked: trackedCodes.has(code),
        loading: loadingCode === code,
        hasError: errorCode === code,
        unavailable: unavailable.has(code),
        onAdd: () => addCourse(code),
    });

    return { rowProps };
}
