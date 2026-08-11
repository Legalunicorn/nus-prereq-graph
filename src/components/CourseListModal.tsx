import { useState } from "react";
import type { FoundationCourse } from "../data/csFoundation";
import type { Mod } from "../types/types";
import { fetchMod } from "../utils/api";
import CourseRow from "./CourseRow";
import "./PresetsModal.css";

interface CourseListModalProps {
    title: string;
    courses: FoundationCourse[];
    mods: Mod[];
    onAdd: (mod: Mod) => void;
    onRemove: (code: string) => void;
    onClose: () => void;
}

export default function CourseListModal({ title, courses, mods, onAdd, onRemove, onClose }: CourseListModalProps) {
    const [loadingCode, setLoadingCode] = useState<string | null>(null);
    const [errorCode, setErrorCode] = useState<string | null>(null);
    const trackedCodes = new Set(mods.map(mod => mod.code));

    const handleAddCourse = async (code: string) => {
        if (trackedCodes.has(code)) return;
        setLoadingCode(code);
        setErrorCode(null);
        try {
            onAdd(await fetchMod(code));
        } catch {
            setErrorCode(code);
        } finally {
            setLoadingCode(null);
        }
    };

    return (
        <div className="presets-overlay" onClick={onClose}>
            <div className="presets-modal" onClick={event => event.stopPropagation()}>
                <div className="presets-header">
                    <h2>{title}</h2>
                    <button className="presets-close" onClick={onClose} aria-label={`Close ${title}`}>✕</button>
                </div>
                <div className="presets-list presets-simple-list">
                    <ul className="presets-course-list">
                        {courses.map(course => (
                            <CourseRow
                                key={course.code}
                                course={course}
                                tracked={trackedCodes.has(course.code)}
                                loading={loadingCode === course.code}
                                hasError={errorCode === course.code}
                                onAdd={() => handleAddCourse(course.code)}
                                onRemove={() => onRemove(course.code)}
                            />
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
