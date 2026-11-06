import type { Mod } from "../types/types";
import { minSemestersLabel } from "../plan/minSemesters";
import { statusOf } from "../plan/modStatus";
import type { ModStatus } from "../plan/modStatus";
import SemesterTag from "./SemesterTag";
import StatusSelect from "./StatusSelect";

interface ModRowProps {
    mod: Mod;
    minSemesters: number | null;
    warnings?: string[];
    onRemove: (code: string) => void;
    onStatusChange: (code: string, status: ModStatus) => void;
    onSelect: (code: string) => void;
    onHover: (code: string | null) => void;
}

export default function ModRow({ mod, minSemesters, warnings, onRemove, onStatusChange, onSelect, onHover }: ModRowProps) {
    const { code, title } = mod;
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
            <button className="mod-info" onClick={() => onSelect(code)}>
                <span className="mod-code">{code}</span>
                <span className="mod-title" title={title}>{title}</span>
                <span className="mod-meta">
                    <SemesterTag code={code} />
                    {mod.plannedTerm && <span className="mod-term">{mod.plannedTerm}</span>}
                    {minSemesters !== null && <span className="mod-estimate">{minSemestersLabel(minSemesters)}</span>}
                    {warnings && (
                        <span className="mod-warning" role="img" aria-label={warnings.join(". ")} title={warnings.join(". ")}>⚠</span>
                    )}
                </span>
            </button>
            <StatusSelect code={code} status={statusOf(mod)} onChange={onStatusChange} />
            <button className="mod-remove" onClick={() => onRemove(code)} aria-label={`Remove ${code}`}>✕</button>
        </li>
    );
}
