import { useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import { PHONE_WIDTH } from "../constants";

export function ControlButton({ tip, ...props }: ComponentProps<"button"> & { tip: string }) {
    return <button data-tip={tip} aria-description={tip} {...props} />;
}

export default function GraphControls({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(() => !window.matchMedia(PHONE_WIDTH).matches);

    return (
        <div className="graph-controls">
            {isOpen && children}
            <ControlButton
                tip={isOpen ? "Hide these buttons" : "Show graph buttons"}
                aria-expanded={isOpen}
                aria-label={isOpen ? "Hide graph controls" : "Show graph controls"}
                onClick={() => setIsOpen(prev => !prev)}
            >
                {isOpen ? "▴" : "▾"}
            </ControlButton>
        </div>
    );
}
