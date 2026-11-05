export interface CourseRowProps {
    course: { code: string; title: string; note?: string };
    tracked: boolean;
    loading: boolean;
    hasError: boolean;
    unavailable: boolean;
    onAdd: () => void;
    onRemove: () => void;
}

function buttonLabel({ tracked, loading, hasError, unavailable }: CourseRowProps) {
    if (tracked) return "Added";
    if (loading) return "...";
    if (unavailable) return "Unavailable";
    return hasError ? "Retry" : "Add";
}

export default function CourseRow(props: CourseRowProps) {
    const { course, tracked, loading, unavailable, onAdd, onRemove } = props;
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
                disabled={loading || (unavailable && !tracked)}
                title={unavailable && !tracked ? "This module isn't in the current NUSMods catalogue" : undefined}
            >
                {buttonLabel(props)}
            </button>
        </li>
    );
}
