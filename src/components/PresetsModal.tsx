import { useState } from "react";
import { FOCUS_AREAS } from "../data/focusAreas";
import { fetchMod } from "../utils/api";
import type { Mod } from "../types/types";
import "./PresetsModal.css";

interface PresetsModalProps {
    mods: Mod[];
    onAdd: (mod: Mod) => void;
    onRemove: (code: string) => void;
    onClose: () => void;
}

export default function PresetsModal({ mods, onAdd, onRemove, onClose }: PresetsModalProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [loadingCode, setLoadingCode] = useState<string | null>(null);
    const [errorCode, setErrorCode] = useState<string | null>(null);

    const trackedCodes = new Set(mods.map(m => m.code));

    const handleToggleArea = (id: string) => {
        setExpandedId(prev => (prev === id ? null : id));
    };

    const handleAddCourse = async (code: string) => {
        if (trackedCodes.has(code)) return;
        setLoadingCode(code);
        setErrorCode(null);
        try {
            const mod = await fetchMod(code);
            onAdd(mod);
        } catch {
            setErrorCode(code);
        } finally {
            setLoadingCode(null);
        }
    };

    const handleRemoveCourse = (code: string) => {
        onRemove(code);
    };

    return (
        <div className="presets-overlay" onClick={onClose}>
            <div className="presets-modal" onClick={e => e.stopPropagation()}>
                <div className="presets-header">
                    <h2>Focus Area Presets</h2>
                    <button className="presets-close" onClick={onClose}>✕</button>
                </div>

                <div className="presets-list">
                    {FOCUS_AREAS.map(area => {
                        const isExpanded = expandedId === area.id;
                        return (
                            <div key={area.id} className="presets-area">
                                <button
                                    className="presets-area-header"
                                    onClick={() => handleToggleArea(area.id)}
                                >
                                    <span>{area.name}</span>
                                    <span className={`presets-chevron ${isExpanded ? "expanded" : ""}`}>▸</span>
                                </button>

                                <div className={`presets-area-body ${isExpanded ? "expanded" : ""}`}>
                                    <div className="presets-area-body-inner">
                                        <p className="presets-description">{area.description}</p>

                                        <h4>Primaries</h4>
                                        <ul className="presets-course-list">
                                            {area.primaries.map(course => (
                                                <CourseRow
                                                    key={course.code}
                                                    course={course}
                                                    tracked={trackedCodes.has(course.code)}
                                                    loading={loadingCode === course.code}
                                                    hasError={errorCode === course.code}
                                                    onAdd={() => handleAddCourse(course.code)}
                                                    onRemove={() => handleRemoveCourse(course.code)}
                                                />
                                            ))}
                                        </ul>

                                        <h4>Electives</h4>
                                        <ul className="presets-course-list">
                                            {area.electives.map(course => (
                                                <CourseRow
                                                    key={course.code}
                                                    course={course}
                                                    tracked={trackedCodes.has(course.code)}
                                                    loading={loadingCode === course.code}
                                                    hasError={errorCode === course.code}
                                                    onAdd={() => handleAddCourse(course.code)}
                                                    onRemove={() => handleRemoveCourse(course.code)}
                                                />
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

interface CourseRowProps {
    course: { code: string; title: string; note?: string };
    tracked: boolean;
    loading: boolean;
    hasError: boolean;
    onAdd: () => void;
    onRemove: () => void;
}

function CourseRow({ course, tracked, loading, hasError, onAdd, onRemove }: CourseRowProps) {
    return (
        <li className="presets-course-row">
            <span className="presets-course-code">{course.code}</span>
            <span className="presets-course-title">
                {course.title}
                {course.note && <span className="presets-course-note"> ({course.note})</span>}
            </span>
            <button
                className={`presets-add-btn ${tracked ? "added" : ""}`}
                onClick={tracked ? onRemove : onAdd}
                disabled={loading}
            >
                {tracked ? "Added" : loading ? "..." : hasError ? "Retry" : "Add"}
            </button>
        </li>
    );
}