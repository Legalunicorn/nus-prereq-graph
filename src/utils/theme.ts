export type Theme = "light" | "dark";

export function resolveTheme(saved: string | null, prefersDark: boolean): Theme {
    if (saved === "light" || saved === "dark") {
        return saved;
    }
    return prefersDark ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
    document.documentElement.dataset.theme = theme;
}

export function readGraphPalette() {
    const styles = getComputedStyle(document.documentElement);
    const color = (name: string) => styles.getPropertyValue(`--graph-${name}`).trim();
    return {
        notPlannedFill: color("not-planned-fill"),
        notPlannedBorder: color("not-planned-border"),
        notPlannedText: color("not-planned-text"),
        ready: color("ready"),
        blocked: color("blocked"),
        completed: color("completed"),
        onStatus: color("on-status"),
        notOffered: color("not-offered"),
        fulfilled: color("fulfilled"),
        unfulfilled: color("unfulfilled"),
        neutral: color("neutral"),
        gateText: color("gate-text"),
        tag: color("tag"),
        tagText: color("tag-text"),
        canvas: styles.getPropertyValue("--canvas").trim(),
        mono: styles.getPropertyValue("--mono").trim(),
    };
}

export type GraphPalette = ReturnType<typeof readGraphPalette>;
