import { describe, expect, it } from "vitest";
import { assignTracks } from "./edgeTracks";

describe("assignTracks", () => {
    it("gives targets in the same column different tracks", () => {
        const tracks = assignTracks([
            { id: "A", column: 100, cross: 0 },
            { id: "B", column: 100, cross: 50 },
            { id: "C", column: 100, cross: 100 },
        ]);
        expect(new Set(tracks.values()).size).toBe(3);
    });

    it("orders tracks by position so edges cross less", () => {
        const tracks = assignTracks([
            { id: "LOW", column: 100, cross: 100 },
            { id: "HIGH", column: 100, cross: 0 },
        ]);
        expect(tracks.get("HIGH")).toBeLessThan(tracks.get("LOW") ?? 0);
    });

    it("assigns columns separately", () => {
        const tracks = assignTracks([
            { id: "A", column: 100, cross: 0 },
            { id: "B", column: 300, cross: 0 },
        ]);
        expect(tracks.get("A")).toBe(tracks.get("B"));
    });

    it("keeps tracks inside the edge", () => {
        const targets = Array.from({ length: 30 }, (_, i) => ({ id: `T${i}`, column: 0, cross: i }));
        for (const track of assignTracks(targets).values()) {
            expect(track).toBeGreaterThanOrEqual(25);
            expect(track).toBeLessThanOrEqual(80);
        }
    });
});
