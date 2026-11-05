import type usePlanEstimate from "../hooks/usePlanEstimate";
import type { Mod } from "../types/types";
import ModuleSearch from "./ModuleSearch";
import PlanSummary from "./PlanSummary";
import SemesterTag from "./SemesterTag";
import "./Sidebar.css";

interface SidebarProps {
    mods: Mod[];
    onAdd: (mod:Mod) => void;
    onRemove:(code:string) => void;
    onToggle: (code:string) => void;
    onOpenPresets: () => void;
    onOpenFoundations: () => void;
    onOpenMathAndScience: () => void;
    collapsed: boolean;
    plan: ReturnType<typeof usePlanEstimate>;
}

export default function Sidebar({mods, onAdd, onRemove, onToggle, onOpenPresets, onOpenFoundations, onOpenMathAndScience, collapsed, plan}: SidebarProps){
    return (
        <div className={`sidebar ${collapsed?"collapsed":""}`}>
             <ModuleSearch mods={mods} onAdd={onAdd} />
             <button className="preset" onClick={onOpenPresets}> CS Focus Areas Preset</button>
             <button className="preset" onClick={onOpenFoundations}>CS Foundations</button>
             <button className="preset" onClick={onOpenMathAndScience}>CS Math &amp; Science</button>
             {plan.estimate && (
                <PlanSummary mods={mods} estimate={plan.estimate} start={plan.start} onStartChange={plan.setStart} />
             )}
             <ul>
                {mods.map(m =>(
                    <li className="mod-li" key={m.code}>
                        <input className="custom-cb" type="checkbox" checked={m.completed} onChange={()=> onToggle(m.code)} aria-label={`Mark ${m.code} completed`} />
                        <div className="mod-info">
                            <span className="mod-code">{m.code}</span>
                            <span className="mod-title" title={m.title}>{m.title}</span>
                            <span className="mod-meta">
                                <SemesterTag code={m.code} />
                                {!m.completed && plan.estimate?.(m.code) != null && (
                                    <span className="mod-estimate">{plan.estimate(m.code)} sem</span>
                                )}
                            </span>
                        </div>
                        <button onClick = {() => onRemove(m.code)} aria-label={`Remove ${m.code}`}>✕</button>
                    </li>
                ))}
             </ul>
        </div>
    )
}
