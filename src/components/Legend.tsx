import { useState } from "react";
import "./Legend.css";

const NODE_ITEMS = [
    { className: "completed", label: "✓ Completed" },
    { className: "ready", label: "In plan, can take" },
    { className: "blocked", label: "In plan, prerequisites unmet" },
    { className: "not-planned", label: "Not in plan" },
    { className: "not-offered", label: "Not offered this AY" },
];

const EDGE_ITEMS = [
    { className: "fulfilled", label: "Prerequisite met" },
    { className: "unfulfilled", label: "Prerequisite unmet" },
    { className: "neutral", label: "Not needed: module completed" },
];

export default function Legend() {
    const [open, setOpen] = useState(true);

    return (
        <div className="legend">
            <button className="legend-toggle" onClick={() => setOpen(prev => !prev)} aria-expanded={open}>
                Legend
            </button>
            {open && (
                <ul className="legend-items">
                    {NODE_ITEMS.map(item => (
                        <li key={item.className}>
                            <span className={`legend-node ${item.className}`} />
                            {item.label}
                        </li>
                    ))}
                    {EDGE_ITEMS.map(item => (
                        <li key={item.className}>
                            <span className={`legend-edge ${item.className}`} />
                            {item.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
