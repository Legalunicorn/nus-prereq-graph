import { useState } from "react";
import { useModSearch } from "../hooks/useModSearch";
import type { Mod } from "../types/types";
import "./Sidebar.css";

interface SidebarProps {
    mods: Mod[];
    onAdd: (mod:Mod) => void;
    onRemove:(code:string) => void;
    onToggle: (code:string) => void;
    onRefresh: (code: string) => void;
}

export default function Sidebar({mods, onAdd, onRemove, onToggle, onRefresh}: SidebarProps){
    const [query, setQuery] = useState("");
    const {searchMod, loading, error} = useModSearch();

    const handleAdd = async () => {
        const code = query.trim().toUpperCase();
        if (!code) return;
        // if already exist 
        if (mods.some(m => m.code === code)) {
            setQuery("");
            return;
        }
        const mod = await searchMod(code);
        if (mod) onAdd(mod);
        setQuery("");
    }

    return (
        <div className="sidebar">
            <input

                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAdd()} 
                placeholder="e.g. CS2100"
             />
             {/* <button onClick={handleAdd} disabled={loading}> Add</button> */}
             {error && <p className="error"> {error} </p>}
             <ul>
                {mods.map(m =>(
                    <li className="mod-li" key={m.code}>
                        <input className="custom-cb" type="checkbox" checked={m.completed} onChange={()=> onToggle(m.code)} />
                        {m.code} 
                        {/* <button onClick = {() => onRefresh(m.code)}>↻</button> */}
                        <button onClick = {() => onRemove(m.code)}>✕</button>
                    </li>
                ))}
             </ul>
        </div>
    )
}