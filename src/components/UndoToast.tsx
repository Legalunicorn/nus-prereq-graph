import { removalLabel } from "../hooks/useUndoableRemoval";
import type { Mod } from "../types/types";
import "./UndoToast.css";

interface UndoToastProps {
    removed: Mod[];
    onUndo: () => void;
    onDismiss: () => void;
}

export default function UndoToast({ removed, onUndo, onDismiss }: UndoToastProps) {
    return (
        <div className="undo-toast" role="status">
            <span>{removalLabel(removed)}</span>
            <button className="undo-action" onClick={onUndo}>Undo</button>
            <button className="undo-dismiss" onClick={onDismiss} aria-label="Dismiss">✕</button>
        </div>
    );
}
