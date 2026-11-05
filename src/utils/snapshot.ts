import type { PrereqTree } from "../types/types";

export interface SnapshotModule {
    title: string;
    semesters: number[];
    prereqTree?: PrereqTree;
}

export interface Snapshot {
    acadYear: string;
    generatedAt: string;
    modules: Record<string, SnapshotModule>;
}

export async function fetchSnapshot(): Promise<Snapshot> {
    const res = await fetch(`${import.meta.env.BASE_URL}data/snapshot.json`);
    if (!res.ok) {
        throw new Error("Couldn't load the prerequisite snapshot");
    }
    return res.json();
}
