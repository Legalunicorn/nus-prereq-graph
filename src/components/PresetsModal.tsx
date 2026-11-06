import { useState } from "react";
import { FOCUS_AREAS } from "../data/focusAreas";
import useCourseAdd from "../hooks/useCourseAdd";
import type { Course, Mod } from "../types/types";
import { meetsFocusAreaRule, searchFocusAreas } from "../plan/focusAreaSearch";
import "./PresetsModal.css";
import CourseRow from "./CourseRow";
import Modal from "./Modal";

interface PresetsModalProps {
    mods: Mod[]; onAdd: (mod: Mod) => void; onRemove: (code: string) => void; onClose: () => void;
}

export default function PresetsModal({ mods, onAdd, onRemove, onClose }: PresetsModalProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const isSearching = query.trim() !== "";
    const matches = searchFocusAreas(FOCUS_AREAS, query);
    const { rowProps, addCourses, isAdding } = useCourseAdd(mods, onAdd);
    const plannedCodes = new Set(mods.map(mod => mod.code));
    const notPlanned = (courses: Course[]) =>
        courses.map(course => course.code).filter(code => !plannedCodes.has(code));

    const handleToggleArea = (id: string) => setExpandedId(prev => (prev === id ? null : id));

    return (
        <Modal title="Focus Area Presets" onClose={onClose}>
            <input
                className="presets-search"
                type="search"
                placeholder="Search all focus areas"
                aria-label="Search all focus areas"
                value={query}
                onChange={event => setQuery(event.target.value)}
            />
            <div className="presets-list">
                {isSearching && (
                    <ul className="presets-course-list presets-search-results">
                        {matches.map(course => (
                            <CourseRow key={course.code} course={course} {...rowProps(course.code)} onRemove={() => onRemove(course.code)} />
                        ))}
                        {matches.length === 0 && <li className="presets-no-results">No matches</li>}
                    </ul>
                )}
                {!isSearching && FOCUS_AREAS.map(area => {
                    const isExpanded = expandedId === area.id;
                    const remaining = notPlanned(area.primaries).length;
                    return (
                        <div key={area.id} className="presets-area">
                            <button className="presets-area-header" onClick={() => handleToggleArea(area.id)}>
                                <span>{area.name}</span>
                                {remaining < area.primaries.length && (
                                    <span
                                        className={`presets-progress ${meetsFocusAreaRule(area, plannedCodes) ? "met" : ""}`}
                                        title="Primaries in plan. An area needs 3, with one at level 4000 or above"
                                    >
                                        {meetsFocusAreaRule(area, plannedCodes) && "✓ "}
                                        {area.primaries.length - remaining}/{area.primaries.length}
                                    </span>
                                )}
                                <span className={`presets-chevron ${isExpanded ? "expanded" : ""}`}>▸</span>
                            </button>
                            <div className={`presets-area-body ${isExpanded ? "expanded" : ""}`}>
                                <div className="presets-area-body-inner">
                                    <p className="presets-description">{area.description}</p>
                                    <h4 className="presets-heading">
                                        Primaries
                                        {remaining > 0 && (
                                            <button
                                                className="presets-add-all"
                                                disabled={isAdding}
                                                onClick={() => addCourses(notPlanned(area.primaries))}
                                            >
                                                Add all
                                            </button>
                                        )}
                                    </h4>
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
        </Modal>
    );
}
