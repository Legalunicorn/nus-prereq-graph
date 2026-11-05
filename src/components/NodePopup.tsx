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
    onClose: () => void;
    onAdd: (mod: Mod) => void;
    onRemove: (code: string) => void;
    onToggle: (code: string) => void;
}

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : "Something went wrong.");

export default function NodePopup({ code, x, y, mods, onClose, onAdd, onRemove, onToggle }: NodePopupProps) {
    const [loading, setLoading] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const existing = mods.find(m => m.code === code);
    const tracked = !!existing;
    const completed = existing?.completed ?? false;
    const [fetchedTitle, setFetchedTitle] = useState<string | undefined>();
    const title = existing?.title ?? fetchedTitle;
    const unavailable = notFound && !tracked;

    useEffect(() => {
        if (existing?.title) return;
        let cancelled = false;
        fetchMod(code)
            .then(mod => { if (!cancelled) setFetchedTitle(mod.title); })
            .catch(err => { if (!cancelled && err instanceof ModNotFoundError) setNotFound(true); });
        return () => { cancelled = true; };
    }, [code, existing?.title]);

    const handleAddRemove = async () => {
        if (tracked) { onRemove(code); return; }
        setLoading(true);
        setError(null);
        try {
            onAdd(await fetchMod(code));
        } catch (err) {
            if (err instanceof ModNotFoundError) setNotFound(true);
            else setError(errorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleToggleComplete = async () => {
        if (tracked) { onToggle(code); return; }
        setLoading(true);
        setError(null);
        try {
            onAdd({ ...(await fetchMod(code)), completed: true });
        } catch (err) {
            if (err instanceof ModNotFoundError) onAdd(missingMod(code, true));
            else setError(errorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="node-popup" style={{ left: x, top: y }}>
            <div className="node-popup-header">
                <span>{code} <SemesterTag code={code} /></span>
                <button className="node-popup-close" onClick={onClose}>✕</button>
            </div>
            {title && <div className="node-popup-title" title={title}>{title}</div>}
            {unavailable && (
                <div className="node-popup-note">{NOT_IN_CATALOGUE}. If you took it, you can still mark it completed.</div>
            )}
            {error && <div className="node-popup-error" role="alert">{error}</div>}
            <label className="node-popup-row">
                <input type="checkbox" checked={completed} onChange={handleToggleComplete} disabled={loading} />
                Completed
            </label>
            {!unavailable && (
                <button className="node-popup-btn" onClick={handleAddRemove} disabled={loading}>
                    {tracked ? "Remove from list" : loading ? "..." : "Add to list"}
                </button>
            )}
            <a className="node-popup-link" href={`https://nusmods.com/courses/${code}`} target="_blank" rel="noreferrer">
                View on NUSMods ↗
            </a>
        </div>
    );
}
