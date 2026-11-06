import type usePlanEstimate from "../hooks/usePlanEstimate";
import type { Mod } from "../types/types";
import useOfferings from "../hooks/useOfferings";
import { isDone } from "../plan/modStatus";
import type { ModStatus } from "../plan/modStatus";
import { planWarnings, takeableNext } from "../plan/semesterPlan";
import ModList from "./ModList";
import ModRow from "./ModRow";
import ModuleSearch from "./ModuleSearch";
import PlanSummary from "./PlanSummary";
import "./Sidebar.css";

interface SidebarProps {
    mods: Mod[];
    onAdd: (mod:Mod) => void;
    onRemove:(code:string) => void;
    onClear: () => void;
    onStatusChange: (code: string, status: ModStatus) => void;
    onSelect: (code: string) => void;
    onHover: (code: string | null) => void;
    onOpenPresets: () => void;
    onOpenFoundations: () => void;
    onOpenMathAndScience: () => void;
    isCollapsed: boolean;
    plan: ReturnType<typeof usePlanEstimate>;
}

export default function Sidebar({mods, onAdd, onRemove, onClear, onStatusChange, onSelect, onHover, onOpenPresets, onOpenFoundations, onOpenMathAndScience, isCollapsed, plan}: SidebarProps){
    const minSemestersOf = (mod: Mod) => (isDone(mod) ? null : plan.estimate?.(mod.code) ?? null);
    const offerings = useOfferings();
    const warnings = planWarnings(mods, offerings);
    const nextUp = plan.estimate ? takeableNext(mods, plan.estimate) : [];
    const renderRow = (mod: Mod) => (
        <ModRow
            key={mod.code}
            mod={mod}
            minSemesters={minSemestersOf(mod)}
            warnings={warnings.get(mod.code)}
            onRemove={onRemove}
            onStatusChange={onStatusChange}
            onSelect={onSelect}
            onHover={onHover}
        />
    );
    const handleClearAll = () => {
        if (window.confirm(`Remove all ${mods.length} modules from your plan?`)) {
            onClear();
        }
    };

    return (
        <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
             <ModuleSearch mods={mods} onAdd={onAdd} />
             <button className="preset" onClick={onOpenPresets}>CS Focus Areas Preset</button>
             <button className="preset" onClick={onOpenFoundations}>CS Foundations</button>
             <button className="preset" onClick={onOpenMathAndScience}>CS Math &amp; Science</button>
             {plan.estimate && (
                <PlanSummary mods={mods} estimate={plan.estimate} start={plan.start} onStartChange={plan.setStart} />
             )}
             {nextUp.length > 0 && (
                <div className="next-up" title="Prerequisites met and offered next semester">
                    <span>Next</span>
                    {nextUp.map(mod => <button key={mod.code} onClick={() => onSelect(mod.code)}>{mod.code}</button>)}
                </div>
             )}
             <ModList mods={mods} renderRow={renderRow} />
             {mods.length > 0 && <button className="clear-all" onClick={handleClearAll}>Clear all</button>}
        </div>
    )
}
