import { useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import "./PresetsModal.css";

interface ModalProps {
    title: string;
    onClose: () => void;
    children: ReactNode;
}

/** The native dialog keeps focus inside and handles Esc. Runs in a layout effect so focus returns before removal. */
export default function Modal({ title, onClose, children }: ModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useLayoutEffect(() => {
        const dialog = dialogRef.current;
        const previouslyFocused = document.activeElement;
        dialog?.showModal();
        return () => {
            dialog?.close();
            if (previouslyFocused instanceof HTMLElement) {
                previouslyFocused.focus();
            }
        };
    }, []);

    return (
        <dialog
            ref={dialogRef}
            className="presets-dialog"
            aria-label={title}
            onCancel={event => {
                event.preventDefault();
                onClose();
            }}
            onClick={event => {
                if (event.target === dialogRef.current) {
                    onClose();
                }
            }}
        >
            <div className="presets-modal">
                <div className="presets-header">
                    <h2>{title}</h2>
                    <button className="presets-close" onClick={onClose} aria-label={`Close ${title}`}>✕</button>
                </div>
                {children}
            </div>
        </dialog>
    );
}
