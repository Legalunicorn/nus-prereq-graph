import { useEffect, useState } from "react";
import type { Mod } from "../types/types";
import { fetchMod } from "../utils/api";
import { loadMods, saveMods } from "../utils/storage";

export default function useStoredMods(){
    const [mods, setMods] = useState<Mod[]>(loadMods);
    
    useEffect(() => { saveMods(mods); }, [mods]);

    const addMods = (m: Mod) => setMods(prev => prev.some(cur => cur.code == m.code) ? prev : [...prev, m]);
    const removeMods = (code: string) => setMods(prev => prev.filter(m => m.code !== code));
    
    const toggleComplete = (code: string) => setMods(prev =>
        prev.map(cur => cur.code === code ? {...cur, completed: !cur.completed} : cur)
    );

    const refreshMod = async(code: string) => {
        const updatred = await fetchMod(code);
        setMods(prev => 
            prev.map(cur => cur.code == code 
                ? {...cur, title:updatred.title, prereqTree: updatred.prereqTree, fulfillRequirements: updatred.fulfillRequirements}
                : cur
            )
        )
    };

    return {mods, addMods, removeMods, toggleComplete, refreshMod};
};