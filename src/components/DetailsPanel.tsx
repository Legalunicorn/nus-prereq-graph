import { useEffect, useState } from "react";
import useEscapeKey from "../hooks/useEscapeKey";
import useOfferings from "../hooks/useOfferings";
import type { Mod, Term } from "../types/types";
import { fetchMod, missingMod, ModNotFoundError, NOT_IN_CATALOGUE } from "../utils/api";
import { planWarnings, TERMS } from "../utils/semesterPlan";
import { cleanRequirement, codesIn, fetchDetails, focusAreasFor, mentionsProgrammes } from "../utils/moduleDetails";
import type { ModuleDetails } from "../utils/moduleDetails";
import { statusOf } from "../utils/modStatus";
import type { ModStatus } from "../utils/modStatus";
import SemesterTag from "./SemesterTag";
import StatusSelect from "./StatusSelect";
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
    onStatusChange: (code: string, status: ModStatus) => void;
    onPlanTerm: (code: string, term: Term | undefined) => void;
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
    const { code, mods, minSemesters, onClose, onSelect, onAdd, onRemove, onStatusChange, onPlanTerm } = props;
    const [details, setDetails] = useState<ModuleDetails | null>(null);
    const [isNotFound, setIsNotFound] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const offerings = useOfferings();
    useEscapeKey(onClose);

    const existing = mods.find(mod => mod.code === code);
    const isTracked = !!existing;
    const isUnavailable = isNotFound && !isTracked;
    const plannedCodes = new Set(mods.map(mod => mod.code));
    const precludedCodes = codesIn(details?.preclusionRule ?? details?.preclusion).filter(other => other !== code);
    const clashes = precludedCodes.filter(other => plannedCodes.has(other));
    const warnings = planWarnings(mods, offerings).get(code) ?? [];
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

    const addToPlan = async () => {
        setIsBusy(true);
        setError(null);
        try {
            onAdd(await fetchMod(code));
        } catch (err) {
            if (err instanceof ModNotFoundError) {
                onAdd(missingMod(code, false));
            } else {
                setError(errorMessage(err));
            }
        } finally {
            setIsBusy(false);
        }
    };

    const handleAddRemove = () => {
        if (isTracked) {
            onRemove(code);
        } else {
            addToPlan();
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
                {isTracked && (
                    <>
                        <StatusSelect code={code} status={statusOf(existing)} onChange={onStatusChange} />
                        <select
                            aria-label={`Planned term for ${code}`}
                            value={existing.plannedTerm ?? ""}
                            onChange={event => onPlanTerm(code, (event.target.value || undefined) as Term | undefined)}
                        >
                            <option value="">No term</option>
                            {TERMS.map(term => <option key={term} value={term}>{term}</option>)}
                        </select>
                    </>
                )}
                {!isUnavailable && (
                    <button onClick={handleAddRemove} disabled={isBusy}>{isTracked ? "Remove" : "Add"}</button>
                )}
            </div>
            {warnings.map(warning => <p key={warning} className="details-error">{warning}</p>)}

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
