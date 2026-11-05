import { useState } from "react";
import "./Legend.css";

const NODE_ITEMS = [
    { className: "completed", label: "Completed" },
    { className: "taking", label: "Taking" },
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
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="legend">
            <button className="legend-toggle" onClick={() => setIsOpen(prev => !prev)} aria-expanded={isOpen}>
                Legend
            </button>
            {isOpen && (
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
                    <li><span className="legend-gate and" />AND: all needed</li>
                    <li><span className="legend-gate or" />OR: any one</li>
                </ul>
            )}
        </div>
    );
}
