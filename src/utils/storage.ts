import type { Mod } from "../types/types";
import { CURR_ACAD_YEAR, STORAGE_KEY } from "../constants";

export interface StorageData{
    acadYear: string;
    mods: Mod[];
}

export function loadMods(): Mod[]{
    try{
        const json = localStorage.getItem(STORAGE_KEY);
        if (!json) return []; 
        const data: StorageData = JSON.parse(json);
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

export function saveMods(mods: Mod[]){
    const data: StorageData = {acadYear: CURR_ACAD_YEAR, mods};
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}