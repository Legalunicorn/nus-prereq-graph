import { useState } from "react";
import type { KeyboardEvent } from "react";
import { useModSearch } from "../hooks/useModSearch";
import useOfferings from "../hooks/useOfferings";
import type { Mod } from "../types/types";
import { searchModules } from "../utils/offerings";
import SemesterTag from "./SemesterTag";
import "./ModuleSearch.css";

interface ModuleSearchProps {
    mods: Mod[];
    onAdd: (mod: Mod) => void;
}

export default function ModuleSearch({ mods, onAdd }: ModuleSearchProps) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const { searchMod, loading, error } = useModSearch();
    const offerings = useOfferings();

    const results = open && offerings ? searchModules(offerings, query) : [];
    const isTracked = (code: string) => mods.some(mod => mod.code === code);

    const clear = () => {
        setQuery("");
        setActiveIndex(0);
    };

    const add = async (code: string) => {
        if (!code) return;
        if (isTracked(code)) {
            clear();
            return;
        }
        const mod = await searchMod(code);
        if (mod) {
            onAdd(mod);
            clear();
        }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Enter") {
            add(results[activeIndex]?.code ?? query.trim().toUpperCase());
        } else if (event.key === "Escape") {
            setOpen(false);
        } else if (results.length > 0 && event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex(index => (index + 1) % results.length);
        } else if (results.length > 0 && event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex(index => (index - 1 + results.length) % results.length);
        }
    };

    return (
        <div className="module-search">
            <input
                value={query}
                onChange={event => {
                    setQuery(event.target.value);
                    setActiveIndex(0);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                onKeyDown={handleKeyDown}
                placeholder="Search modules"
                aria-label="Search modules by code or title"
                aria-busy={loading}
            />
            {results.length > 0 && (
                <ul className="module-search-results">
                    {results.map((result, index) => (
                        <li key={result.code}>
                            <button
                                className={`module-search-result ${index === activeIndex ? "active" : ""}`}
                                onMouseDown={event => event.preventDefault()}
                                onClick={() => add(result.code)}
                            >
                                <span className="module-search-code">
                                    {result.code} <SemesterTag code={result.code} />
                                    {isTracked(result.code) && <span className="module-search-added"> · Added</span>}
                                </span>
                                <span className="module-search-title">{result.title}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            {loading && <p className="module-search-status">Adding...</p>}
            {error && <p className="module-search-error" role="alert">{error}</p>}
        </div>
    );
}
