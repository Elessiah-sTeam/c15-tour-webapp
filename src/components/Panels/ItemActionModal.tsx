import { type MouseEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Pencil, Save, Trash, X } from "lucide-react";
import "./Panels.css";
import { DEFAULT_PAUSE_DURATION } from "../SettingsModal/settingsTypes.ts";

type ItemActionModalProps = {
    isOpen: boolean;
    mode: "segment" | "step";
    initialName: string;
    initialPauseDuration?: number;
    onClose: () => void;
    onSave: (name: string, pauseDuration?: number) => void;
    onDelete: () => void;
};

export default function ItemActionModal({ isOpen, ...props }: ItemActionModalProps) {
    if (!isOpen) return null;
    return <ItemActionModalContent {...props} />;
}

function ItemActionModalContent({
    mode,
    initialName,
    initialPauseDuration,
    onClose,
    onSave,
    onDelete
}: Omit<ItemActionModalProps, 'isOpen'>) {
    const [name, setName] = useState(initialName);
    const [pauseDuration, setPauseDuration] = useState(initialPauseDuration ?? DEFAULT_PAUSE_DURATION);

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    const handleSave = () => {
        const trimmedName = name.trim();

        if (!trimmedName) {
            return;
        }

        onSave(trimmedName, mode === "segment" ? pauseDuration : undefined);
        onClose();
    };

    const handleDelete = () => {
        onDelete();
        onClose();
    };

    return createPortal(
        <div className="item-action-modal-overlay" onClick={handleOverlayClick}>
            <div className="item-action-modal" onClick={(event) => event.stopPropagation()}>
                <div className="item-action-modal-header">
                    <h3>
                        <Pencil size={16} />
                        {mode === "segment" ? "Actions du segment" : "Actions de l'étape"}
                    </h3>
                    <button
                        type="button"
                        className="item-action-close"
                        aria-label="Fermer"
                        onClick={onClose}
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="item-action-modal-body">
                    <label className="item-action-label">
                        Nom
                        <input
                            type="text"
                            className="item-action-input"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />
                    </label>

                    {mode === "segment" ? (
                        <label className="item-action-label">
                            Pause (minutes)
                            <input
                                type="number"
                                className="item-action-input"
                                value={pauseDuration}
                                onChange={(event) => setPauseDuration(Number(event.target.value))}
                                min="0"
                                max="120"
                                step="5"
                            />
                        </label>
                    ) : null}
                </div>

                <div className="item-action-modal-footer">
                    <button
                        type="button"
                        className="item-action-btn item-action-btn-delete"
                        onClick={handleDelete}
                    >
                        <Trash size={15} />
                        Supprimer
                    </button>
                    <button
                        type="button"
                        className="item-action-btn item-action-btn-save"
                        onClick={handleSave}
                    >
                        <Save size={15} />
                        Enregistrer
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
