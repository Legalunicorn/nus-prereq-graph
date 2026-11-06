import type { ModStatus } from "../utils/modStatus";
import "./StatusSelect.css";

const LABELS: Record<ModStatus, string> = { planned: "Planned", taking: "Taking", done: "Done" };

interface StatusSelectProps {
    code: string;
    status: ModStatus;
    onChange: (code: string, status: ModStatus) => void;
}

export default function StatusSelect({ code, status, onChange }: StatusSelectProps) {
    return (
        <select
            className={`status-select ${status}`}
            aria-label={`Status of ${code}`}
            value={status}
            onChange={event => onChange(code, event.target.value as ModStatus)}
        >
            {Object.entries(LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
    );
}
