import type usePlanEstimate from "../hooks/usePlanEstimate";
import type { Mod } from "../types/types";
import useModuleCredits from "../hooks/useModuleCredits";
import useOfferings from "../hooks/useOfferings";
import { isDone } from "../utils/modStatus";
import { groupByTerm, planWarnings } from "../utils/semesterPlan";
import ModRow from "./ModRow";
import ModuleSearch from "./ModuleSearch";
import PlanSummary from "./PlanSummary";
import "./Sidebar.css";

interface SidebarProps {
    mods: Mod[];
    onAdd: (mod:Mod) => void;
    onRemove:(code:string) => void;
    onClear: () => void;
    onToggle: (code:string) => void;
    onToggleTaking: (code:string) => void;
    onSelect: (code: string) => void;
    onHover: (code: string | null) => void;
    onOpenPresets: () => void;
    onOpenFoundations: () => void;
    onOpenMathAndScience: () => void;
    isCollapsed: boolean;
    plan: ReturnType<typeof usePlanEstimate>;
}

export default function Sidebar({mods, onAdd, onRemove, onClear, onToggle, onToggleTaking, onSelect, onHover, onOpenPresets, onOpenFoundations, onOpenMathAndScience, isCollapsed, plan}: SidebarProps){
    const minSemestersOf = (mod: Mod) => (isDone(mod) ? null : plan.estimate?.(mod.code) ?? null);
    const offerings = useOfferings();
    const warnings = planWarnings(mods, offerings);
    const plannedCodes = mods.filter(mod => mod.plannedTerm).map(mod => mod.code);
    const credits = useModuleCredits(plannedCodes);
    const renderRow = (mod: Mod) => (
        <ModRow
            key={mod.code}
            mod={mod}
            minSemesters={minSemestersOf(mod)}
            warnings={warnings.get(mod.code)}
            onRemove={onRemove}
            onToggle={onToggle}
            onToggleTaking={onToggleTaking}
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
             <button className="preset" onClick={onOpenPresets}> CS Focus Areas Preset</button>
             <button className="preset" onClick={onOpenFoundations}>CS Foundations</button>
             <button className="preset" onClick={onOpenMathAndScience}>CS Math &amp; Science</button>
             {plan.estimate && (
                <PlanSummary mods={mods} estimate={plan.estimate} start={plan.start} onStartChange={plan.setStart} />
             )}
             {plannedCodes.length === 0 ? (
                <ul>{mods.map(renderRow)}</ul>
             ) : (
                groupByTerm(mods, code => credits.get(code) ?? 0).map(group => (
                    <section key={group.term ?? "none"}>
                        <h3 className="term-heading">
                            {group.term ?? "No term"}
                            {group.term && <span>{group.credits} MC</span>}
                        </h3>
                        <ul>{group.mods.map(renderRow)}</ul>
                    </section>
                ))
             )}
             {mods.length > 0 && <button className="clear-all" onClick={handleClearAll}>Clear all</button>}
        </div>
    )
}
