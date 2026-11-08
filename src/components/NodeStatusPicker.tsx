import { useState } from "react";
import type { RefObject } from "react";
import { statusOf, withStatus } from "../plan/modStatus";
import type { ModStatus } from "../plan/modStatus";
import type { Mod } from "../types/types";
import { fetchForPlan } from "../utils/api";
import "./NodeStatusPicker.css";

const OPTIONS: { status: ModStatus; label: string }[] = [
    { status: "planned", label: "Planned" },
    { status: "taking", label: "Taking" },
    { status: "done", label: "Done" },
];

interface NodeStatusPickerProps {
    code: string;
    mods: Mod[];
    pickerRef: RefObject<HTMLDivElement | null>;
    onAdd: (mod: Mod) => void;
    onRemove: (code: string) => void;
    onStatusChange: (code: string, status: ModStatus) => void;
}

export default function NodeStatusPicker({ code, mods, pickerRef, onAdd, onRemove, onStatusChange }: NodeStatusPickerProps) {
    const [isBusy, setIsBusy] = useState(false);
    const [hasError, setHasError] = useState(false);
    const existing = mods.find(mod => mod.code === code);
    const current = existing ? statusOf(existing) : null;

    const addWithStatus = async (status: ModStatus) => {
        setIsBusy(true);
        setHasError(false);
        try {
            onAdd(withStatus(await fetchForPlan(code), status));
        } catch {
            setHasError(true);
        } finally {
            setIsBusy(false);
        }
    };

    const pick = (status: ModStatus) => {
        if (!existing) {
            addWithStatus(status);
        } else if (status === current) {
            onRemove(code);
        } else {
            onStatusChange(code, status);
        }
    };

    return (
        <div ref={pickerRef} className="node-status-picker">
            <div className="node-status-options" role="group" aria-label={`Status of ${code}`}>
                {OPTIONS.map(({ status, label }) => (
                    <button
                        key={status}
                        className={status === current ? "active" : ""}
                        aria-pressed={status === current}
                        disabled={isBusy}
                        onClick={() => pick(status)}
                    >
                        {label}
                    </button>
                ))}
            </div>
            {hasError && <p role="alert">Couldn't add. Try again.</p>}
        </div>
    );
}
