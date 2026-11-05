export interface PlacedNode { id: string; x: number; y: number; }

export const CELL_WIDTH = 100;
const ROW_SPACING = 62;
const RANK_SPACING = 88;

/**
 * Packs a top-to-bottom layout into at most `maxPerRow` nodes per row, continuing long ranks on
 * extra rows, so the graph fits a narrow screen. Returns null if it already fits.
 */
export function wrapRanks(nodes: PlacedNode[], maxPerRow: number): Map<string, { x: number; y: number }> | null {
    if (nodes.length === 0) {
        return null;
    }
    const xs = nodes.map(node => node.x);
    const left = Math.min(...xs);
    const right = Math.max(...xs);
    if (right - left <= (maxPerRow - 1) * CELL_WIDTH) {
        return null;
    }

    const ranks = new Map<number, PlacedNode[]>();
    for (const node of nodes) {
        const key = Math.round(node.y);
        ranks.set(key, [...(ranks.get(key) ?? []), node]);
    }

    const centerX = (left + right) / 2;
    const placed = new Map<string, { x: number; y: number }>();
    let y = Math.min(...ranks.keys());
    for (const key of [...ranks.keys()].sort((a, b) => a - b)) {
        const sorted = [...(ranks.get(key) ?? [])].sort((a, b) => a.x - b.x);
        for (let start = 0; start < sorted.length; start += maxPerRow) {
            const row = sorted.slice(start, start + maxPerRow);
            row.forEach((node, index) => {
                placed.set(node.id, { x: centerX + (index - (row.length - 1) / 2) * CELL_WIDTH, y });
            });
            y += ROW_SPACING;
        }
        y += RANK_SPACING - ROW_SPACING;
    }
    return placed;
}
