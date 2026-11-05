import type { Mod } from "../types/types";
import SemesterTag from "./SemesterTag";

interface ModRowProps {
    mod: Mod;
    minSemesters: number | null;
    warnings?: string[];
    onRemove: (code: string) => void;
    onToggle: (code: string) => void;
    onToggleTaking: (code: string) => void;
    onSelect: (code: string) => void;
    onHover: (code: string | null) => void;
}

export default function ModRow({ mod, minSemesters, warnings, onRemove, onToggle, onToggleTaking, onSelect, onHover }: ModRowProps) {
    const { code, title, completed, taking } = mod;
    return (
        <li
            className="mod-li"
            onPointerEnter={event => {
                // A touch has no matching leave, so it would stay highlighted.
                if (event.pointerType === "mouse") {
                    onHover(code);
                }
            }}
            onPointerLeave={() => onHover(null)}
        >
            <input className="custom-cb" type="checkbox" checked={completed} onChange={() => onToggle(code)} aria-label={`Mark ${code} completed`} />
            <button className="mod-info" onClick={() => onSelect(code)}>
                <span className="mod-code">{code}</span>
                <span className="mod-title" title={title}>{title}</span>
                <span className="mod-meta">
                    <SemesterTag code={code} />
                    {minSemesters !== null && <span className="mod-estimate">{minSemesters} sem</span>}
                    {warnings && (
                        <span className="mod-warning" role="img" aria-label={warnings.join(". ")} title={warnings.join(". ")}>⚠</span>
                    )}
                </span>
            </button>
            <button
                className={taking ? "taking-toggle active" : "taking-toggle"}
                onClick={() => onToggleTaking(code)}
                aria-pressed={!!taking}
                aria-label={`Mark ${code} as currently taking`}
                title="Currently taking"
            >
                ◐
            </button>
            <button onClick={() => onRemove(code)} aria-label={`Remove ${code}`}>✕</button>
        </li>
    );
}
