import { useState } from "react";
import { FOCUS_AREAS } from "../data/focusAreas";
import useCourseAdd from "../hooks/useCourseAdd";
import type { Mod } from "../types/types";
import "./PresetsModal.css";
import CourseRow from "./CourseRow";

interface PresetsModalProps {
    mods: Mod[]; onAdd: (mod: Mod) => void; onRemove: (code: string) => void; onClose: () => void;
}

export default function PresetsModal({ mods, onAdd, onRemove, onClose }: PresetsModalProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const { rowProps } = useCourseAdd(mods, onAdd);

    const handleToggleArea = (id: string) => setExpandedId(prev => (prev === id ? null : id));

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
                                <button className="presets-area-header" onClick={() => handleToggleArea(area.id)}>
                                    <span>{area.name}</span>
                                    <span className={`presets-chevron ${isExpanded ? "expanded" : ""}`}>▸</span>
                                </button>
                                <div className={`presets-area-body ${isExpanded ? "expanded" : ""}`}>
                                    <div className="presets-area-body-inner">
                                        <p className="presets-description">{area.description}</p>
                                        <h4>Primaries</h4>
                                        <ul className="presets-course-list">
                                            {area.primaries.map(course => (
                                                <CourseRow key={course.code} course={course} {...rowProps(course.code)} onRemove={() => onRemove(course.code)} />
                                            ))}
                                        </ul>
                                        <h4>Electives</h4>
                                        <ul className="presets-course-list">
                                            {area.electives.map(course => (
                                                <CourseRow key={course.code} course={course} {...rowProps(course.code)} onRemove={() => onRemove(course.code)} />
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
