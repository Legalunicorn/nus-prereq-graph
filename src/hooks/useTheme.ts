import { useState } from "react";
import { THEME_KEY } from "../constants";
import { applyTheme, resolveTheme } from "../utils/theme";
import type { Theme } from "../utils/theme";

function loadSaved() {
    try {
        return localStorage.getItem(THEME_KEY);
    } catch {
        return null;
    }
}

function loadTheme(): Theme {
    const theme = resolveTheme(loadSaved(), window.matchMedia("(prefers-color-scheme: dark)").matches);
    applyTheme(theme);
    return theme;
}

export default function useTheme() {
    const [theme, setTheme] = useState(loadTheme);

    const toggleTheme = () => {
        const next: Theme = theme === "dark" ? "light" : "dark";
        applyTheme(next);
        setTheme(next);
        try {
            localStorage.setItem(THEME_KEY, next);
        } catch {
            // The choice just won't be remembered.
        }
    };

    return { theme, toggleTheme };
}
