import {type ReactNode, useEffect} from "react";
import {createPortal} from "react-dom";
import "./Modal.css";

type ModalProps = {
    open: boolean;
    title?: string;
    onClose: () => void;
    children: ReactNode;
};

export default function Modal({open, title, onClose, children}: ModalProps) {
    useEffect(() => {
        if (!open) return;
        const handler = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open, onClose]);

    useEffect(() => {
        if (!open) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.body.classList.add("modal-open");
        return () => {
            document.body.style.overflow = previousOverflow;
            document.body.classList.remove("modal-open");
        };
    }, [open]);

    if (!open) return null;

    return createPortal(
        <div className="modal-backdrop" role="presentation" onClick={onClose}>
            <div
                className="modal-card"
                role="dialog"
                aria-modal="true"
                aria-label={title ?? "Fen\u00eatre modale"}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    {title ? <h4 className="modal-title">{title}</h4> : <span />}
                    <button
                        className="modal-close"
                        type="button"
                    onClick={onClose}
                        aria-label="Fermer la fenêtre"
                    >
                        X
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
