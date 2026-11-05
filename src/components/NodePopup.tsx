import { useEffect, useState } from "react";
import type { Mod } from "../types/types";
import { fetchMod, missingMod, ModNotFoundError, NOT_IN_CATALOGUE } from "../utils/api";
import SemesterTag from "./SemesterTag";
import "./NodePopup.css";

interface NodePopupProps {
    code: string;
    x: number;
    y: number;
    mods: Mod[];
    minSemesters: number | null;
    onClose: () => void;
    onAdd: (mod: Mod) => void;
    onRemove: (code: string) => void;
    onToggle: (code: string) => void;
    onToggleTaking: (code: string) => void;
}

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : "Something went wrong.");

export default function NodePopup({ code, x, y, mods, minSemesters, onClose, onAdd, onRemove, onToggle, onToggleTaking }: NodePopupProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isNotFound, setIsNotFound] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const existing = mods.find(m => m.code === code);
    const isTracked = !!existing;
    const isCompleted = existing?.completed ?? false;
    const [fetchedTitle, setFetchedTitle] = useState<string | undefined>();
    const title = existing?.title ?? fetchedTitle;
    const isUnavailable = isNotFound && !isTracked;

    useEffect(() => {
        if (existing?.title) {
            return;
        }
        let cancelled = false;
        fetchMod(code)
            .then(mod => { if (!cancelled) { setFetchedTitle(mod.title); } })
            .catch(err => { if (!cancelled && err instanceof ModNotFoundError) { setIsNotFound(true); } });
        return () => { cancelled = true; };
    }, [code, existing?.title]);

    const handleAddRemove = async () => {
        if (isTracked) { onRemove(code); return; }
        setIsLoading(true);
        setError(null);
        try {
            onAdd(await fetchMod(code));
        } catch (err) {
            if (err instanceof ModNotFoundError) {
                setIsNotFound(true);
            }
            else {
                setError(errorMessage(err));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const addWithStatus = async (status: Pick<Mod, "completed" | "taking">) => {
        setIsLoading(true);
        setError(null);
        try {
            onAdd({ ...(await fetchMod(code)), ...status });
        } catch (err) {
            if (err instanceof ModNotFoundError) {
                onAdd({ ...missingMod(code, false), ...status });
            }
            else {
                setError(errorMessage(err));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleComplete = () => {
        if (isTracked) {
            onToggle(code);
        } else {
            addWithStatus({ completed: true });
        }
    };

    const handleToggleTaking = () => {
        if (isTracked) {
            onToggleTaking(code);
        } else {
            addWithStatus({ completed: false, taking: true });
        }
    };

    return (
        <div className="node-popup" style={{ left: x, top: y }}>
            <div className="node-popup-header">
                <span>{code} <SemesterTag code={code} /></span>
                <button className="node-popup-close" onClick={onClose}>✕</button>
            </div>
            {title && <div className="node-popup-title" title={title}>{title}</div>}
            {minSemesters !== null && minSemesters > 0 && (
                <div className="node-popup-note">{minSemesters} {minSemesters === 1 ? "sem" : "sems"} min</div>
            )}
            {isUnavailable && (
                <div className="node-popup-note">{NOT_IN_CATALOGUE}</div>
            )}
            {error && <div className="node-popup-error" role="alert">{error}</div>}
            <label className="node-popup-row">
                <input type="checkbox" checked={isCompleted} onChange={handleToggleComplete} disabled={isLoading} />
                Completed
            </label>
            <label className="node-popup-row">
                <input type="checkbox" checked={!!existing?.taking} onChange={handleToggleTaking} disabled={isLoading} />
                Taking
            </label>
            {!isUnavailable && (
                <button className="node-popup-btn" onClick={handleAddRemove} disabled={isLoading}>
                    {isTracked ? "Remove from list" : isLoading ? "..." : "Add to list"}
                </button>
            )}
            <a className="node-popup-link" href={`https://nusmods.com/courses/${code}`} target="_blank" rel="noreferrer">
                View on NUSMods ↗
            </a>
        </div>
    );
}
