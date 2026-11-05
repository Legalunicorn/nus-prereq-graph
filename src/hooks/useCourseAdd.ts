import { useState } from "react";
import type { Mod } from "../types/types";
import { fetchMod, ModNotFoundError } from "../utils/api";

export default function useCourseAdd(mods: Mod[], onAdd: (mod: Mod) => void) {
    const [loadingCode, setLoadingCode] = useState<string | null>(null);
    const [errorCode, setErrorCode] = useState<string | null>(null);
    const [unavailableCodes, setUnavailableCodes] = useState<ReadonlySet<string>>(new Set());
    const trackedCodes = new Set(mods.map(mod => mod.code));

    const addCourse = async (code: string) => {
        if (trackedCodes.has(code)) {
            return;
        }
        setLoadingCode(code);
        setErrorCode(null);
        try {
            onAdd(await fetchMod(code));
        } catch (err) {
            if (err instanceof ModNotFoundError) {
                setUnavailableCodes(prev => new Set(prev).add(code));
            } else {
                setErrorCode(code);
            }
        } finally {
            setLoadingCode(null);
        }
    };

    const addCourses = async (codes: string[]) => {
        for (const code of codes) {
            await addCourse(code);
        }
    };

    const rowProps = (code: string) => ({
        isTracked: trackedCodes.has(code),
        isLoading: loadingCode === code,
        hasError: errorCode === code,
        isUnavailable: unavailableCodes.has(code),
        onAdd: () => addCourse(code),
    });

    return { rowProps, addCourses, isAdding: loadingCode !== null };
}
