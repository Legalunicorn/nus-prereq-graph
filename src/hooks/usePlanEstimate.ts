import { useMemo, useState } from "react";
import type { Mod } from "../types/types";
import { createEstimator, nextSemester } from "../plan/minSemesters";
import { isDone } from "../plan/modStatus";
import type { RegularSemester } from "../plan/minSemesters";
import useSnapshot from "./useSnapshot";

export default function usePlanEstimate(mods: Mod[]) {
    const snapshot = useSnapshot();
    const [start, setStart] = useState<RegularSemester>(() => nextSemester(new Date()));

    const { estimate, explain, longestPaths } = useMemo(() => {
        if (!snapshot) {
            return { estimate: null, explain: null, longestPaths: [] };
        }
        const completed = new Set(mods.filter(isDone).map(mod => mod.code));
        const preferred = new Set(mods.map(mod => mod.code));
        const estimator = createEstimator({ modules: snapshot.modules, completed, start, preferred });

        const remaining = mods.filter(mod => !isDone(mod));
        const longest = Math.max(0, ...remaining.map(mod => estimator.estimate(mod.code) ?? 0));
        return {
            estimate: estimator.estimate,
            explain: estimator.explain,
            longestPaths: remaining
                .filter(mod => estimator.estimate(mod.code) === longest)
                .flatMap(mod => estimator.longestChains(mod.code)),
        };
    }, [snapshot, mods, start]);

    return { estimate, explain, longestPaths, start, setStart };
}
