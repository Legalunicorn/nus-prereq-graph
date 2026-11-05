import type { FocusArea } from "../data/focusAreas";

export interface FocusAreaMatch {
    code: string;
    title: string;
    note: string;
}

const PRIMARIES_NEEDED = 3;
const SENIOR_LEVEL = 4;

/** Finds courses by code or title, once each, noting every area they count toward. */
export function searchFocusAreas(areas: FocusArea[], query: string): FocusAreaMatch[] {
    const needle = query.trim().toLowerCase();
    if (!needle) {
        return [];
    }
    const matches = new Map<string, { title: string; areas: string[] }>();
    for (const area of areas) {
        const courses = [
            ...area.primaries.map(course => ({ ...course, label: `${area.name} (primary)` })),
            ...area.electives.map(course => ({ ...course, label: area.name })),
        ];
        for (const { code, title, label } of courses) {
            if (code.toLowerCase().includes(needle) || title.toLowerCase().includes(needle)) {
                const match = matches.get(code) ?? { title, areas: [] };
                if (!match.areas.some(existing => existing.startsWith(area.name))) {
                    match.areas.push(label);
                }
                matches.set(code, match);
            }
        }
    }
    return [...matches].map(([code, { title, areas: names }]) => ({ code, title, note: names.join(", ") }));
}

const levelOf = (code: string) => Number(code.match(/\d/)?.[0] ?? 0);

/** The NUS CS rule: 3 Area Primaries, at least one at level 4000 or above. */
export function meetsFocusAreaRule(area: FocusArea, plannedCodes: ReadonlySet<string>) {
    const planned = area.primaries.filter(course => plannedCodes.has(course.code));
    return planned.length >= PRIMARIES_NEEDED && planned.some(course => levelOf(course.code) >= SENIOR_LEVEL);
}
