import { useEffect } from "react";

export default function useEscapeKey(onEscape: () => void) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // An open dialog handles Esc itself, and only the top layer should close.
            if (event.key === "Escape" && !document.querySelector("dialog[open]")) {
                onEscape();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onEscape]);
}
