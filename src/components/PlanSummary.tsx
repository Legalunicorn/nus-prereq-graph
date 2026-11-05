import type { Mod } from "../types/types";
import type { RegularSemester } from "../utils/minSemesters";
import "./PlanSummary.css";

interface PlanSummaryProps {
    mods: Mod[];
    estimate: (code: string) => number | null;
    start: RegularSemester;
    onStartChange: (semester: RegularSemester) => void;
}

const ASSUMPTIONS = "Lower bound: no workload limit, this year's offerings repeat, no MA1301 needed. * Some modules have no estimate.";

export default function PlanSummary({ mods, estimate, start, onStartChange }: PlanSummaryProps) {
    const estimates = mods.filter(mod => !mod.completed).map(mod => estimate(mod.code));
    const known = estimates.filter(semesters => semesters !== null);
    if (known.length === 0) {
        return null;
    }
    const total = Math.max(...known);

    return (
        <div className="plan-summary" title={ASSUMPTIONS}>
            <span>
                <strong>{total}</strong> {total === 1 ? "sem" : "sems"} min
                {known.length < estimates.length && " *"}
            </span>
            <select
                aria-label="Next semester"
                value={start}
                onChange={event => onStartChange(Number(event.target.value) as RegularSemester)}
            >
                <option value={1}>from S1</option>
                <option value={2}>from S2</option>
            </select>
        </div>
    );
}
