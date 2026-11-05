export interface ModuleListing {
    title: string;
    /** 1 and 2 are regular semesters; 3 and 4 are special terms. */
    semesters: readonly number[];
}

/** Every module in this AY's catalogue, by code. */
export type Offerings = ReadonlyMap<string, ModuleListing>;

export const NOT_OFFERED = "Not offered";

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 8;

export function isOffered(offerings: Offerings, code: string): boolean {
    return (offerings.get(code)?.semesters.length ?? 0) > 0;
}

/** Returns an empty label for the usual case of running in both regular semesters. */
export function semesterLabel(offerings: Offerings, code: string): string {
    if (!isOffered(offerings, code)) return NOT_OFFERED;
    const semesters = offerings.get(code)?.semesters ?? [];
    const hasSpecialTerm = semesters.includes(3) || semesters.includes(4);
    if (semesters.includes(1) && semesters.includes(2)) {
        return hasSpecialTerm ? "+ST" : "";
    }
    const parts = [];
    if (semesters.includes(1)) parts.push("S1");
    if (semesters.includes(2)) parts.push("S2");
    if (hasSpecialTerm) parts.push("ST");
    return parts.join("·");
}

/** Matches on the start of the code first, then anywhere in the title. */
export function searchModules(offerings: Offerings, query: string) {
    const text = query.trim().toLowerCase();
    if (text.length < MIN_QUERY_LENGTH) return [];

    const byCode = [];
    const byTitle = [];
    for (const [code, { title }] of offerings) {
        if (code.toLowerCase().startsWith(text)) byCode.push({ code, title });
        else if (title.toLowerCase().includes(text)) byTitle.push({ code, title });
    }
    return [...byCode, ...byTitle].slice(0, MAX_RESULTS);
}
