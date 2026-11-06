import { useState } from "react";

function load<T>(key: string, fallback: T, isValid: (value: unknown) => value is T): T {
    try {
        const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
        return isValid(parsed) ? parsed : fallback;
    } catch {
        return fallback;
    }
}

/** State kept in localStorage. Anything unreadable or invalid falls back to the default. */
export default function useStoredState<T>(key: string, fallback: T, isValid: (value: unknown) => value is T) {
    const [value, setValue] = useState<T>(() => load(key, fallback, isValid));

    const update = (next: T) => {
        setValue(next);
        try {
            localStorage.setItem(key, JSON.stringify(next));
        } catch {
            // The choice just won't be remembered.
        }
    };

    return [value, update] as const;
}
