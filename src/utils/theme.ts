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
        taking: color("taking"),
        onStatus: color("on-status"),
        notOffered: color("not-offered"),
        fulfilled: color("fulfilled"),
        unfulfilled: color("unfulfilled"),
        neutral: color("neutral"),
        gateText: color("gate-text"),
        tag: color("tag"),
        tagText: color("tag-text"),
        accent: styles.getPropertyValue("--accent").trim(),
        canvas: styles.getPropertyValue("--canvas").trim(),
        mono: styles.getPropertyValue("--mono").trim(),
    };
}

export type GraphPalette = ReturnType<typeof readGraphPalette>;

/** Mixes a #rrggbb color toward white (amount > 0) or black (amount < 0). */
export function shade(hex: string, amount: number) {
    const target = amount > 0 ? 255 : 0;
    const channels = [1, 3, 5].map(start => {
        const channel = parseInt(hex.slice(start, start + 2), 16);
        return Math.round(channel + (target - channel) * Math.abs(amount));
    });
    return `rgb(${channels.join(",")})`;
}
