export interface CourseRowProps {
    course: { code: string; title: string; note?: string };
    tracked: boolean;
    loading: boolean;
    hasError: boolean;
    onAdd: () => void;
    onRemove: () => void;
}

export default function CourseRow({ course, tracked, loading, hasError, onAdd, onRemove }: CourseRowProps) {
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