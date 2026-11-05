import type { Mod } from "../types/types";
import ModuleSearch from "./ModuleSearch";
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
}

export default function Sidebar({mods, onAdd, onRemove, onToggle, onOpenPresets, onOpenFoundations, onOpenMathAndScience, collapsed}: SidebarProps){
    return (
        <div className={`sidebar ${collapsed?"collapsed":""}`}>
             <ModuleSearch mods={mods} onAdd={onAdd} />
             <button className="preset" onClick={onOpenPresets}> CS Focus Areas Preset</button>
             <button className="preset" onClick={onOpenFoundations}>CS Foundations</button>
             <button className="preset" onClick={onOpenMathAndScience}>CS Math &amp; Science</button>
             <ul>
                {mods.map(m =>(
                    <li className="mod-li" key={m.code}>
                        <input className="custom-cb" type="checkbox" checked={m.completed} onChange={()=> onToggle(m.code)} />
                        <div className="mod-info">
                            <span className="mod-code">{m.code} <SemesterTag code={m.code} /></span>
                            <span className="mod-title" title={m.title}>{m.title}</span>
                        </div>
                        <button onClick = {() => onRemove(m.code)}>✕</button>
                    </li>
                ))}
             </ul>
        </div>
    )
}
