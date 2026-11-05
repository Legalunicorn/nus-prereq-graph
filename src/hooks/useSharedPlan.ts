import { useCallback, useEffect, useState } from "react";
import type { Mod } from "../types/types";
import { refreshCatalogue } from "../utils/api";
import { decodePlan } from "../utils/sharePlan";
import type { SharedMod } from "../utils/sharePlan";

function clearHash() {
    history.replaceState(null, "", location.pathname + location.search);
}

async function fetchSharedMods(plan: SharedMod[]): Promise<Mod[] | null> {
    const stubs = plan.map(mod => ({ ...mod, title: mod.code }));
    const { refreshed, complete } = await refreshCatalogue(stubs);
    if (!complete) {
        return null;
    }
    const byCode = new Map(refreshed.map(mod => [mod.code, mod]));
    return plan.flatMap(mod => {
        const fresh = byCode.get(mod.code);
        return fresh ? [{ ...fresh, ...mod }] : [];
    });
}

/** Loads a plan from the URL straight away if the list is empty, otherwise waits for confirmation. */
export default function useSharedPlan(currentCount: number, replaceMods: (mods: Mod[]) => void) {
    const [plan, setPlan] = useState(() => decodePlan(location.hash));
    const [hasError, setHasError] = useState(false);

    const finishLoading = useCallback((mods: Mod[] | null) => {
        if (mods) {
            replaceMods(mods);
            setPlan(null);
            clearHash();
        } else {
            setHasError(true);
        }
    }, [replaceMods]);

    const accept = () => {
        if (plan) {
            fetchSharedMods(plan).then(finishLoading);
        }
    };

    const dismiss = () => {
        setPlan(null);
        clearHash();
    };

    const planToAutoLoad = currentCount === 0 && !hasError ? plan : null;
    useEffect(() => {
        if (planToAutoLoad) {
            fetchSharedMods(planToAutoLoad).then(finishLoading);
        }
    }, [planToAutoLoad, finishLoading]);

    return { pendingCount: plan && !planToAutoLoad ? plan.length : 0, hasError, accept, dismiss };
}
