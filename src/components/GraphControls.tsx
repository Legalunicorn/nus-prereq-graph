import { useState } from "react";
import type { ReactNode } from "react";
import { PHONE_WIDTH } from "../constants";

export default function GraphControls({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(() => !window.matchMedia(PHONE_WIDTH).matches);

    return (
        <div className="graph-controls">
            {isOpen && children}
            <button
                aria-expanded={isOpen}
                aria-label={isOpen ? "Hide graph controls" : "Show graph controls"}
                onClick={() => setIsOpen(prev => !prev)}
            >
                {isOpen ? "›" : "‹"}
            </button>
        </div>
    );
}
