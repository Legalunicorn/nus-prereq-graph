import { useMemo, useState } from "react";
import { START_SEMESTER_KEY } from "../constants";
import type { Mod } from "../types/types";
import { createEstimator, nextSemester } from "../utils/minSemesters";
import type { RegularSemester } from "../utils/minSemesters";
import useSnapshot from "./useSnapshot";

function loadStart(): RegularSemester {
    try {
        const saved = localStorage.getItem(START_SEMESTER_KEY);
        if (saved === "1" || saved === "2") {
            return Number(saved) as RegularSemester;
        }
    } catch {
        // Storage is unavailable, so fall back to the date.
    }
    return nextSemester(new Date());
}

export default function usePlanEstimate(mods: Mod[]) {
    const snapshot = useSnapshot();
    const [start, setStartState] = useState<RegularSemester>(loadStart);

    const setStart = (semester: RegularSemester) => {
        setStartState(semester);
        try {
            localStorage.setItem(START_SEMESTER_KEY, String(semester));
        } catch {
            // The choice just won't be remembered.
        }
    };

    const estimate = useMemo(() => {
        if (!snapshot) {
            return null;
        }
        const completed = new Set(mods.filter(mod => mod.completed).map(mod => mod.code));
        return createEstimator({ modules: snapshot.modules, completed, start });
    }, [snapshot, mods, start]);

    return { estimate, start, setStart };
}
