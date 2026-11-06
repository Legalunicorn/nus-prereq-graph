import { useEffect, useState } from "react";
import { CURR_ACAD_YEAR, DEFAULT_MODULE_CODES, STORAGE_KEY } from "../constants";
import type { Mod, Term } from "../types/types";
import { fetchMod, refreshCatalogue } from "../utils/api";
import { withStatus } from "../plan/modStatus";
import type { ModStatus } from "../plan/modStatus";
import { decodePlan } from "../plan/sharePlan";
import { isFirstVisit, loadStored, parseStored, saveMods } from "../utils/storage";

export default function useStoredMods(){
    const [stored] = useState(loadStored);
    const [mods, setMods] = useState<Mod[]>(stored.mods);
    const [catalogueYear, setCatalogueYear] = useState(stored.acadYear);
    const [isNewVisitor] = useState(() => isFirstVisit() && !decodePlan(location.hash));

    useEffect(() => { saveMods(mods, catalogueYear); }, [mods, catalogueYear]);

    useEffect(() => {
        if (!isNewVisitor) {
            return;
        }
        let isCancelled = false;
        Promise.allSettled(DEFAULT_MODULE_CODES.map(fetchMod)).then(results => {
            if (!isCancelled) {
                const loaded = results.flatMap(result => (result.status === "fulfilled" ? [result.value] : []));
                setMods(prev => (prev.length > 0 ? prev : loaded));
            }
        });
        return () => { isCancelled = true; };
    }, [isNewVisitor]);

    // Saved catalogue data is from an earlier AY: update it and keep the user's plan.
    useEffect(() => {
        if (catalogueYear === CURR_ACAD_YEAR) {
            return;
        }
        let cancelled = false;
        refreshCatalogue(stored.mods).then(({ refreshed, complete }) => {
            if (cancelled) {
                return;
            }
            const byCode = new Map(refreshed.map(mod => [mod.code, mod]));
            setMods(prev => prev.map(cur => {
                const fresh = byCode.get(cur.code);
                return fresh ? { ...fresh, completed: cur.completed, taking: cur.taking, plannedTerm: cur.plannedTerm } : cur;
            }));
            if (complete) {
                setCatalogueYear(CURR_ACAD_YEAR);
            }
        });
        return () => { cancelled = true; };
    }, [catalogueYear, stored.mods]);

    useEffect(() => {
        const handleStorage = (event: StorageEvent) => {
            if (event.key === STORAGE_KEY) {
                setMods(parseStored(event.newValue).mods);
            }
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const addMods = (m: Mod) => setMods(prev => prev.some(cur => cur.code === m.code) ? prev : [...prev, m]);

    const setStatus = (code: string, status: ModStatus) => setMods(prev =>
        prev.map(cur => cur.code === code ? withStatus(cur, status) : cur)
    );

    const setPlannedTerm = (code: string, plannedTerm: Term | undefined) => setMods(prev =>
        prev.map(cur => cur.code === code ? {...cur, plannedTerm} : cur)
    );

    return {mods, addMods, setStatus, setPlannedTerm, replaceMods: setMods};
};
