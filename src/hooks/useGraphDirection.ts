import { useState } from "react";
import { DIRECTION_KEY, PHONE_WIDTH } from "../constants";
import type { GraphDirection } from "../graph/cytoscapeConfig";

export function resolveDirection(saved: string | null, isPhone: boolean): GraphDirection {
    if (saved === "horizontal" || saved === "vertical") {
        return saved;
    }
    return isPhone ? "vertical" : "horizontal";
}

function loadSaved() {
    try {
        return localStorage.getItem(DIRECTION_KEY);
    } catch {
        return null;
    }
}

export default function useGraphDirection() {
    const [direction, setDirection] = useState<GraphDirection>(
        () => resolveDirection(loadSaved(), window.matchMedia(PHONE_WIDTH).matches),
    );

    const toggleDirection = () => {
        const next: GraphDirection = direction === "horizontal" ? "vertical" : "horizontal";
        setDirection(next);
        try {
            localStorage.setItem(DIRECTION_KEY, next);
        } catch {
            // The choice just won't be remembered.
        }
    };

    return { direction, toggleDirection };
}
