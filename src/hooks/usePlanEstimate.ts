import { useMemo, useState } from "react";
import { START_SEMESTER_KEY } from "../constants";
import type { Mod } from "../types/types";
import { createEstimator, nextSemester } from "../utils/minSemesters";
import { isDone } from "../utils/modStatus";
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

    const { estimate, longestPath } = useMemo(() => {
        if (!snapshot) {
            return { estimate: null, longestPath: [] };
        }
        const completed = new Set(mods.filter(isDone).map(mod => mod.code));
        const preferred = new Set(mods.map(mod => mod.code));
        const estimator = createEstimator({ modules: snapshot.modules, completed, start, preferred });

        const remaining = mods.filter(mod => !isDone(mod));
        const slowest = remaining.reduce<Mod | null>((best, mod) => (
            (estimator.estimate(mod.code) ?? 0) > (best ? estimator.estimate(best.code) ?? 0 : 0) ? mod : best
        ), null);
        return {
            estimate: estimator.estimate,
            longestPath: slowest ? estimator.longestChain(slowest.code) : [],
        };
    }, [snapshot, mods, start]);

    return { estimate, longestPath, start, setStart };
}
