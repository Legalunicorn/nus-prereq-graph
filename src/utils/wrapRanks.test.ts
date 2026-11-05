import { describe, expect, it } from "vitest";
import { CELL_WIDTH, wrapRanks } from "./wrapRanks";
import type { PlacedNode } from "./wrapRanks";

const rank = (count: number, y: number, prefix: string): PlacedNode[] =>
    Array.from({ length: count }, (_, i) => ({ id: `${prefix}${i}`, x: i * 200, y }));

describe("wrapRanks", () => {
    it("leaves a layout that already fits alone", () => {
        expect(wrapRanks(rank(3, 0, "A"), 5)).toBeNull();
        expect(wrapRanks([], 4)).toBeNull();
    });

    it("never puts more than the limit in a row", () => {
        const placed = wrapRanks(rank(10, 0, "A"), 4);
        const rows = new Map<number, number>();
        for (const { y } of placed?.values() ?? []) {
            rows.set(y, (rows.get(y) ?? 0) + 1);
        }
        expect(rows.size).toBe(3);
        expect(Math.max(...rows.values())).toBe(4);
    });

    it("fits within the limit's width", () => {
        const placed = wrapRanks(rank(10, 0, "A"), 4);
        const xs = [...(placed?.values() ?? [])].map(p => p.x);
        expect(Math.max(...xs) - Math.min(...xs)).toBeLessThanOrEqual(3 * CELL_WIDTH);
    });

    it("keeps ranks in order, with later ranks below all rows of earlier ones", () => {
        const placed = wrapRanks([...rank(6, 0, "A"), ...rank(1, 100, "B")], 4);
        const lastA = Math.max(...rank(6, 0, "A").map(n => placed?.get(n.id)?.y ?? 0));
        expect(placed?.get("B0")?.y).toBeGreaterThan(lastA);
    });
});
