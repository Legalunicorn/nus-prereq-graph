import type { Mod } from "../types/types";
import type { RegularSemester } from "../utils/minSemesters";
import "./PlanSummary.css";

interface PlanSummaryProps {
    mods: Mod[];
    estimate: (code: string) => number | null;
    start: RegularSemester;
    onStartChange: (semester: RegularSemester) => void;
}

export default function PlanSummary({ mods, estimate, start, onStartChange }: PlanSummaryProps) {
    const estimates = mods.filter(mod => !mod.completed).map(mod => estimate(mod.code));
    const known = estimates.filter(semesters => semesters !== null);
    if (known.length === 0) return null;
    const total = Math.max(...known);

    return (
        <div className="plan-summary">
            <div className="plan-summary-total">
                At least <strong>{total}</strong> {total === 1 ? "semester" : "semesters"}, starting
                <select
                    aria-label="Next semester"
                    value={start}
                    onChange={event => onStartChange(Number(event.target.value) as RegularSemester)}
                >
                    <option value={1}>S1</option>
                    <option value={2}>S2</option>
                </select>
            </div>
            <p className="plan-summary-note">
                Assumes no workload limit, this year's offerings repeating, and no MA1301 needed.
            </p>
            {known.length < estimates.length && (
                <p className="plan-summary-note">Some modules aren't included: they have no estimate.</p>
            )}
        </div>
    );
}
