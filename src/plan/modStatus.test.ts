import { describe, expect, it } from "vitest";
import type { Mod } from "../types/types";
import { statusOf, withStatus } from "./modStatus";

const mod: Mod = { code: "A1", title: "A", completed: false };

describe("statusOf", () => {
    it("reads each status", () => {
        expect(statusOf(mod)).toBe("planned");
        expect(statusOf({ ...mod, taking: true })).toBe("taking");
        expect(statusOf({ ...mod, completed: true })).toBe("done");
    });
});

describe("withStatus", () => {
    it("sets one status and clears the other", () => {
        const done = { ...mod, completed: true };
        expect(withStatus(done, "taking")).toMatchObject({ completed: false, taking: true });
        expect(withStatus({ ...mod, taking: true }, "done")).toMatchObject({ completed: true, taking: false });
        expect(withStatus(done, "planned")).toMatchObject({ completed: false, taking: false });
    });
});
