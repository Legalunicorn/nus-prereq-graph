import { useEffect, useState } from "react";
import type { Mod } from "../types/types";
import { CURR_ACAD_YEAR, STORAGE_KEY } from "../constants";
import { fetchMod } from "../utils/api";

// const STORAGE_KEY = 'nus-graph-mods';
// const CURR_ACAD_YEAR =  '2026-2027';
// const NUSMODS_API = "h"

interface StorageData{
    acadYear: string;
    mods: Mod[];
}

function loadMods(): Mod[]{
    try{
        const json = localStorage.getItem(STORAGE_KEY);
        if (!json) return []; // not found 
        const data: StorageData = JSON.parse(json);
        // out of date
        if (data.acadYear !== CURR_ACAD_YEAR){
            localStorage.removeItem(STORAGE_KEY);
            return [];
        }
        return data.mods;
    } catch{
        console.log("Failed to load local storage");
        return [];
    }
}

function saveMods(mods: Mod[]){
    const data: StorageData = {acadYear: CURR_ACAD_YEAR, mods};
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function useStoredMods(){
    const [mods, setMods] = useState<Mod[]>(loadMods);
    useEffect(() => {
        saveMods(mods);
    }, [mods]);

    const addMods = (m: Mod) => {
        setMods(prev => 
            prev.some(cur => cur.code == m.code) ? prev : [...prev, m]
        );
    };

    const removeMods = (code: string) => {
        setMods(prev => prev.filter(m => m.code !== code));
    };

    const toggleComplete = (code: string) => {
        setMods(prev =>
            prev.map(cur => 
                cur.code === code 
                    ? {...cur, completed: !cur.completed} : cur
            )
        );
    };

    const refreshMod = async(code: string) => {
        const updatred = await fetchMod(code);
        setMods(prev => 
            prev.map(cur =>
                cur.code == code 
                    ? {...cur, title:updatred.title, prereqTree: updatred.prereqTree, fulfillRequirements: updatred.fulfillRequirements}
                    : cur
            )
        )
    };


    return {mods, addMods, removeMods, toggleComplete, refreshMod};
};

