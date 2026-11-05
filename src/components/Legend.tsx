import { useState } from "react";
import "./Legend.css";

const NODE_ITEMS = [
    { className: "completed", label: "Completed" },
    { className: "ready", label: "Can take" },
    { className: "blocked", label: "Blocked" },
    { className: "not-planned", label: "Not in plan" },
    { className: "not-offered", label: "Not offered" },
];

const EDGE_ITEMS = [
    { className: "fulfilled", label: "Met" },
    { className: "unfulfilled", label: "Unmet" },
    { className: "neutral", label: "Not needed" },
];

export default function Legend() {
    const [open, setOpen] = useState(false);

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
