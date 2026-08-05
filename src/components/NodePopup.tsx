import { useEffect, useState } from "react";
import type { Mod } from "../types/types";
import { fetchMod } from "../utils/api";
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

export default function NodePopup({ code, x, y, mods, onClose, onAdd, onRemove, onToggle }: NodePopupProps) {
    const [loading, setLoading] = useState(false);
    const existing = mods.find(m => m.code === code);
    const tracked = !!existing;
    const completed = existing?.completed ?? false;
    const [title, setTitle] = useState<string | undefined>(existing?.title);

    useEffect(() => {
        if (existing?.title) { setTitle(existing.title); return; }
        let cancelled = false;
        fetchMod(code)
            .then(mod => { if (!cancelled) setTitle(mod.title); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [code, existing?.title]);

    const handleAddRemove = async () => {
        if (tracked) { onRemove(code); return; }
        setLoading(true);
        try { const mod = await fetchMod(code); onAdd(mod); } catch {} finally { setLoading(false); }
    };

    const handleToggleComplete = async () => {
        if (tracked) { onToggle(code); return; }
        setLoading(true);
        try { const mod = await fetchMod(code); onAdd({ ...mod, completed: true }); } catch {} finally { setLoading(false); }
    };

    return (
        <div className="node-popup" style={{ left: x, top: y }}>
            <div className="node-popup-header">
                <span>{code}</span>
                <button className="node-popup-close" onClick={onClose}>✕</button>
            </div>
            {title && <div className="node-popup-title" title={title}>{title}</div>}
            <label className="node-popup-row">
                <input type="checkbox" checked={completed} onChange={handleToggleComplete} disabled={loading} />
                Completed
            </label>
            <button className="node-popup-btn" onClick={handleAddRemove} disabled={loading}>
                {tracked ? "Remove from list" : loading ? "..." : "Add to list"}
            </button>
            <a className="node-popup-link" href={`https://nusmods.com/courses/${code}`} target="_blank" rel="noreferrer">
                View on NUSMods ↗
            </a>
        </div>
    );
}