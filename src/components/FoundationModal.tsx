import { CS_FOUNDATION_COURSES } from "../data/csFoundation";
import type { Mod } from "../types/types";
import CourseListModal from "./CourseListModal";

interface FoundationModalProps {
    mods: Mod[];
    onAdd: (mod: Mod) => void;
    onRemove: (code: string) => void;
    onClose: () => void;
}

export default function FoundationModal({ mods, onAdd, onRemove, onClose }: FoundationModalProps) {
    return (
        <CourseListModal
            title="CS Foundations"
            courses={CS_FOUNDATION_COURSES}
            mods={mods}
            onAdd={onAdd}
            onRemove={onRemove}
            onClose={onClose}
        />
    );
}
