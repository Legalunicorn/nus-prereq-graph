import { useEffect, useState } from "react";
import { fetchDetails } from "../utils/moduleDetails";

/** Loads credits on demand, as stored modules don't keep them. A module that fails to load just isn't counted. */
export default function useModuleCredits(codes: string[]) {
    const [credits, setCredits] = useState<ReadonlyMap<string, number>>(new Map());
    const key = codes.join(",");

    useEffect(() => {
        let isCancelled = false;
        for (const code of key ? key.split(",") : []) {
            fetchDetails(code)
                .then(details => {
                    if (!isCancelled && details) {
                        setCredits(prev => new Map(prev).set(code, Number(details.moduleCredit) || 0));
                    }
                })
                .catch(() => {});
        }
        return () => { isCancelled = true; };
    }, [key]);

    return credits;
}
