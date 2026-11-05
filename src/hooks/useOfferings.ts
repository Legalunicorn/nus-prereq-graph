import { useEffect, useState } from "react";
import { fetchOfferings } from "../utils/api";
import type { Offerings } from "../utils/offerings";

// Shared so the whole page makes one request. Cleared on failure so a later mount can retry.
let request: Promise<Offerings> | null = null;

function loadOfferings() {
    request ??= fetchOfferings().catch(err => {
        request = null;
        throw err;
    });
    return request;
}

/** Null until the list has loaded, or if it couldn't be loaded. */
export default function useOfferings(): Offerings | null {
    const [offerings, setOfferings] = useState<Offerings | null>(null);

    useEffect(() => {
        let cancelled = false;
        loadOfferings()
            .then(result => { if (!cancelled) setOfferings(result); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, []);

    return offerings;
}
