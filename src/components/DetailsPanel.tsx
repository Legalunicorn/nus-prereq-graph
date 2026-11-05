import { useEffect, useState } from "react";
import useEscapeKey from "../hooks/useEscapeKey";
import type { Mod } from "../types/types";
import { fetchMod, missingMod, ModNotFoundError, NOT_IN_CATALOGUE } from "../utils/api";
import { cleanRequirement, codesIn, fetchDetails, focusAreasFor, mentionsProgrammes } from "../utils/moduleDetails";
import type { ModuleDetails } from "../utils/moduleDetails";
import SemesterTag from "./SemesterTag";
import "./DetailsPanel.css";

const MAX_UNLOCKS = 12;

interface DetailsPanelProps {
    code: string;
    mods: Mod[];
    minSemesters: number | null;
    onClose: () => void;
    onSelect: (code: string) => void;
    onAdd: (mod: Mod) => void;
    onRemove: (code: string) => void;
    onToggle: (code: string) => void;
    onToggleTaking: (code: string) => void;
}

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : "Something went wrong.");

function Requirement({ label, text }: { label: string; text?: string }) {
    if (!text) {
        return null;
    }
    return (
        <section>
            <h3>{label}</h3>
            <p>{cleanRequirement(text)}</p>
        </section>
    );
}

export default function DetailsPanel(props: DetailsPanelProps) {
    const { code, mods, minSemesters, onClose, onSelect, onAdd, onRemove, onToggle, onToggleTaking } = props;
    const [details, setDetails] = useState<ModuleDetails | null>(null);
    const [isNotFound, setIsNotFound] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    useEscapeKey(onClose);

    const existing = mods.find(mod => mod.code === code);
    const isTracked = !!existing;
    const isUnavailable = isNotFound && !isTracked;
    const plannedCodes = new Set(mods.map(mod => mod.code));
    const precludedCodes = codesIn(details?.preclusionRule ?? details?.preclusion).filter(other => other !== code);
    const clashes = precludedCodes.filter(other => plannedCodes.has(other));
    const focusAreas = focusAreasFor(code);
    const unlocks = details?.fulfillRequirements ?? [];

    useEffect(() => {
        let isCancelled = false;
        fetchDetails(code)
            .then(result => {
                if (!isCancelled) {
                    setDetails(result);
                    setIsNotFound(result === null);
                }
            })
            .catch(err => {
                if (!isCancelled) {
                    setError(errorMessage(err));
                }
            });
        return () => { isCancelled = true; };
    }, [code]);

    const addWithStatus = async (status: Partial<Pick<Mod, "completed" | "taking">>) => {
        setIsBusy(true);
        setError(null);
        try {
            onAdd({ ...(await fetchMod(code)), ...status });
        } catch (err) {
            if (err instanceof ModNotFoundError) {
                onAdd({ ...missingMod(code, false), ...status });
            } else {
                setError(errorMessage(err));
            }
        } finally {
            setIsBusy(false);
        }
    };

    const handleToggleComplete = () => {
        if (isTracked) {
            onToggle(code);
        } else {
            addWithStatus({ completed: true });
        }
    };

    const handleToggleTaking = () => {
        if (isTracked) {
            onToggleTaking(code);
        } else {
            addWithStatus({ taking: true });
        }
    };

    const handleAddRemove = () => {
        if (isTracked) {
            onRemove(code);
        } else {
            addWithStatus({});
        }
    };

    return (
        <aside className="details-panel" aria-label={`Details for ${code}`}>
            <header>
                <h2>{code}</h2>
                <SemesterTag code={code} />
                {details && <span className="details-credit">{details.moduleCredit} MC</span>}
                <button className="details-close" onClick={onClose} aria-label="Close details">✕</button>
            </header>
            <p className="details-title">{details?.title ?? existing?.title}</p>
            {isUnavailable && <p className="details-note">{NOT_IN_CATALOGUE}</p>}
            {minSemesters !== null && minSemesters > 0 && (
                <p className="details-note">{minSemesters} {minSemesters === 1 ? "sem" : "sems"} min</p>
            )}
            {error && <p className="details-error" role="alert">{error}</p>}
            {clashes.length > 0 && <p className="details-error">Precluded by {clashes.join(", ")} in your plan</p>}

            <div className="details-actions">
                <label>
                    <input type="checkbox" checked={existing?.completed ?? false} onChange={handleToggleComplete} disabled={isBusy} />
                    Completed
                </label>
                <label>
                    <input type="checkbox" checked={existing?.taking ?? false} onChange={handleToggleTaking} disabled={isBusy} />
                    Taking
                </label>
                {!isUnavailable && (
                    <button onClick={handleAddRemove} disabled={isBusy}>{isTracked ? "Remove" : "Add"}</button>
                )}
            </div>

            <Requirement label="Prerequisites" text={details?.prerequisite} />
            <Requirement label="Corequisites" text={details?.corequisite} />
            {precludedCodes.length > 0 ? (
                <section>
                    <h3>Preclusions</h3>
                    <div className="details-unlocks">
                        {precludedCodes.map(precluded => (
                            <button key={precluded} onClick={() => onSelect(precluded)}>{precluded}</button>
                        ))}
                    </div>
                    {mentionsProgrammes(details?.preclusion) && <p className="details-note">Also certain programmes</p>}
                </section>
            ) : (
                <Requirement label="Preclusions" text={details?.preclusion} />
            )}

            {focusAreas.length > 0 && (
                <section>
                    <h3>Focus areas</h3>
                    <p>{focusAreas.join(", ")}</p>
                </section>
            )}

            {unlocks.length > 0 && (
                <section>
                    <h3>Unlocks {unlocks.length}</h3>
                    <div className="details-unlocks">
                        {unlocks.slice(0, MAX_UNLOCKS).map(unlocked => (
                            <button key={unlocked} onClick={() => onSelect(unlocked)}>{unlocked}</button>
                        ))}
                    </div>
                </section>
            )}

            <a href={`https://nusmods.com/courses/${code}`} target="_blank" rel="noreferrer">NUSMods ↗</a>
        </aside>
    );
}
