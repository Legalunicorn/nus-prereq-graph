import { useState } from "react";
import type { Mod } from "../types/types";
import { encodePlan } from "../plan/sharePlan";

const RESET_DELAY = 1500;

export default function ShareButton({ mods }: { mods: Mod[] }) {
    const [label, setLabel] = useState("Share");

    const handleShare = async () => {
        const url = `${location.origin}${location.pathname}${encodePlan(mods)}`;
        try {
            await navigator.clipboard.writeText(url);
            setLabel("Copied");
        } catch {
            history.replaceState(null, "", url);
            setLabel("Copy the URL");
        }
        setTimeout(() => setLabel("Share"), RESET_DELAY);
    };

    return <button onClick={handleShare} title="Copy a link to this plan">{label}</button>;
}
