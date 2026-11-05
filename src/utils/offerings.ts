/** Module code to the semesters it runs in this AY. 1 and 2 are regular semesters; 3 and 4 are special terms. */
export type Offerings = ReadonlyMap<string, readonly number[]>;

export const NOT_OFFERED = "Not offered";

export function isOffered(offerings: Offerings, code: string): boolean {
    return (offerings.get(code)?.length ?? 0) > 0;
}

export function semesterLabel(offerings: Offerings, code: string): string {
    if (!isOffered(offerings, code)) return NOT_OFFERED;
    const semesters = offerings.get(code) ?? [];
    const parts = [];
    if (semesters.includes(1)) parts.push("S1");
    if (semesters.includes(2)) parts.push("S2");
    if (semesters.includes(3) || semesters.includes(4)) parts.push("ST");
    return parts.join("·");
}
