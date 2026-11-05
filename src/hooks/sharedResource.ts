import { useEffect, useState } from "react";

/**
 * Creates a hook for data that's loaded once and shared across the app, however many
 * components use it. The hook returns null until loaded, or if loading failed. A failed
 * load is retried the next time a component using the hook mounts.
 */
export function sharedResource<T>(load: () => Promise<T>) {
    let request: Promise<T> | null = null;

    const loadOnce = () => {
        request ??= load().catch(err => {
            request = null;
            throw err;
        });
        return request;
    };

    return function useSharedResource(): T | null {
        const [value, setValue] = useState<T | null>(null);

        useEffect(() => {
            let cancelled = false;
            loadOnce()
                .then(result => { if (!cancelled) setValue(result); })
                .catch(() => {});
            return () => { cancelled = true; };
        }, []);

        return value;
    };
}
