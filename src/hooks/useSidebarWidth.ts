import { useEffect, useState } from "react";
import { SIDEBAR_WIDTH_KEY } from "../constants";

const DEFAULT_WIDTH = 400;
const MIN_WIDTH = 240;
const MAX_WIDTH = 800;

export const clampSidebarWidth = (width: number) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width));

function loadWidth() {
    try {
        const saved = Number(localStorage.getItem(SIDEBAR_WIDTH_KEY));
        return saved > 0 ? clampSidebarWidth(saved) : DEFAULT_WIDTH;
    } catch {
        return DEFAULT_WIDTH;
    }
}

export default function useSidebarWidth() {
    const [width, setWidth] = useState(loadWidth);

    useEffect(() => {
        document.documentElement.style.setProperty("--sidebar-custom-width", `${width}px`);
        try {
            localStorage.setItem(SIDEBAR_WIDTH_KEY, String(width));
        } catch {
            // The width just won't be remembered.
        }
    }, [width]);

    return { width, resize: (next: number) => setWidth(clampSidebarWidth(next)) };
}
