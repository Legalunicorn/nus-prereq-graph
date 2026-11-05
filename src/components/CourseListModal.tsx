import type { FoundationCourse } from "../data/csFoundation";
import useCourseAdd from "../hooks/useCourseAdd";
import type { Mod } from "../types/types";
import CourseRow from "./CourseRow";
import Modal from "./Modal";

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
        <Modal title={title} onClose={onClose}>
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
        </Modal>
    );
}
