import { useState } from "react";
import { fetchMod } from "../utils/api";
import type { Mod } from "../types/types";




export function useModSearch(){
    const [isLoading, setIsLoading] = useState(false);
    const [error,setError] = useState<string|null>(null);

    const searchMod = async(code:string) : Promise<Mod|null> => {
        setIsLoading(true);
        setError(null);
        try{
            const mod = await fetchMod(code);
            return mod;
        } catch( err: unknown){
            const msg = err instanceof Error ? err.message: "Unknown error";
            setError(msg);
            return null;
        } finally{
            setIsLoading(false);
        }
    }

    return {searchMod, isLoading, error};
};