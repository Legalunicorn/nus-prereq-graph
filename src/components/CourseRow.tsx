import type { Course } from "../types/types";
import SemesterTag from "./SemesterTag";

interface CourseRowProps {
    course: Course;
    isTracked: boolean;
    isLoading: boolean;
    hasError: boolean;
    isUnavailable: boolean;
    onAdd: () => void;
    onRemove: () => void;
}

function buttonLabel({ isTracked, isLoading, hasError, isUnavailable }: CourseRowProps) {
    if (isTracked) {
        return "Added";
    }
    if (isLoading) {
        return "...";
    }
    if (isUnavailable) {
        return "Unavailable";
    }
    return hasError ? "Retry" : "Add";
}

export default function CourseRow(props: CourseRowProps) {
    const { course, isTracked, isLoading, isUnavailable, onAdd, onRemove } = props;
    return (
        <li className="presets-course-row">
            <span className="presets-course-code">{course.code}</span>
            <span className="presets-course-title">
                {course.title}
                {course.note && <span className="presets-course-note"> ({course.note})</span>}
            </span>
            <SemesterTag code={course.code} />
            <button
                className={`presets-add-btn ${isTracked ? "added" : ""}`}
                onClick={isTracked ? onRemove : onAdd}
                disabled={isLoading || (isUnavailable && !isTracked)}
                title={isUnavailable && !isTracked ? "This module isn't in the current NUSMods catalogue" : undefined}
            >
                {buttonLabel(props)}
            </button>
        </li>
    );
}
