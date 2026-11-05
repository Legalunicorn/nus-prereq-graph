import type { FoundationCourse } from "../data/csFoundation";
import useCourseAdd from "../hooks/useCourseAdd";
import type { Mod } from "../types/types";
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
    const { rowProps } = useCourseAdd(mods, onAdd);

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
                                {...rowProps(course.code)}
                                onRemove={() => onRemove(course.code)}
                            />
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
