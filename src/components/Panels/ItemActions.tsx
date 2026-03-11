import {useEffect, useState, type MouseEvent, type FormEvent} from "react";
import {Clock3, Save, Settings, Trash2, AlertTriangle} from "lucide-react";
import Modal from "../Modal/Modal.tsx";
import {itineraryModel} from "../../customObject/Itinerary/ItineraryStore.ts";
import type {TimeSpan} from "../../customObject/TimeSpan.ts";

type StepActionsButtonProps = {
    segmentId: string;
    stepId: string;
    currentTitle: string;
    disabled?: boolean;
};

type SegmentActionsButtonProps = {
    segmentId: string;
    currentTitle: string;
    breakDuration?: TimeSpan;
};

function timeSpanToMinutes(breakDuration?: TimeSpan): number {
    if (!breakDuration) return 0;
    return Math.round(breakDuration.duration / 60_000);
}

export function StepActionsButton({segmentId, stepId, currentTitle, disabled}: StepActionsButtonProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(currentTitle);
    const [error, setError] = useState<string>("");
    const [confirmAction, setConfirmAction] = useState<"rename" | "delete" | null>(null);
    const [pendingName, setPendingName] = useState<string>("");

    useEffect(() => {
        setName(currentTitle);
    }, [currentTitle]);

    function handleOpen(e: MouseEvent<HTMLButtonElement>) {
        e.stopPropagation();
        setOpen(true);
    }

    function handleSave(event: FormEvent) {
        event.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            setError("Le nom est obligatoire.");
            return;
        }
        setError("");
        if (trimmed !== currentTitle) {
            setPendingName(trimmed);
            setConfirmAction("rename");
            return;
        }
        setOpen(false);
    }

    function handleDelete() {
        setPendingName(name.trim());
        setConfirmAction("delete");
    }

    function confirmProceed() {
        if (confirmAction === "rename" && pendingName) {
            itineraryModel.renameStep(segmentId, stepId, pendingName);
        } else if (confirmAction === "delete") {
            itineraryModel.removeStep(segmentId, stepId);
        }
        setConfirmAction(null);
        setOpen(false);
    }

    function cancelConfirm() {
        setConfirmAction(null);
    }

    const confirmationMessage =
        confirmAction === "delete"
            ? "Supprimer définitivement cette étape ?"
            : "Confirmer le renommage de l'étape ?";

    if (disabled) return null;

    return (
        <>
            <button
                type="button"
                className="item-action-btn"
                aria-haspopup="dialog"
                aria-label="Actions sur l'étape"
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={handleOpen}
            >
                <Settings size={18} color="#BB487C"/>
            </button>
            <Modal open={open} onClose={() => setOpen(false)} title="Actions sur l'étape">
                <form className="action-form" onSubmit={handleSave}>
                    <label>
                        Nom de l'étape
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (error) setError("");
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            placeholder="Renommer l'étape"
                            autoFocus
                        />
                    </label>
                    {error && <p className="input-error">{error}</p>}
                    <div className="modal-actions">
                        <button type="submit" className="primary-btn">
                            <Save size={16}/> Enregistrer
                        </button>
                        <button type="button" className="danger-btn" onClick={handleDelete}>
                            <Trash2 size={16}/> Supprimer
                        </button>
                        <button type="button" className="ghost-btn" onClick={() => setOpen(false)}>
                            Annuler
                        </button>
                    </div>
                </form>
            </Modal>
            <Modal
                open={confirmAction !== null}
                onClose={cancelConfirm}
                title="Confirmer l'action"
            >
                <div className="confirm-dialog">
                    <div className="confirm-header">
                        <AlertTriangle size={18} color="#BB487C"/>
                        <p>{confirmationMessage}</p>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="primary-btn" onClick={confirmProceed}>
                            OK
                        </button>
                        <button type="button" className="ghost-btn" onClick={cancelConfirm}>
                            Annuler
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}

export function SegmentActionsButton({segmentId, currentTitle, breakDuration}: SegmentActionsButtonProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(currentTitle);
    const [pauseMinutes, setPauseMinutes] = useState<number>(timeSpanToMinutes(breakDuration));
    const [error, setError] = useState<string>("");
    const [confirmAction, setConfirmAction] = useState<"rename" | "delete" | null>(null);
    const [pendingName, setPendingName] = useState<string>("");
    const [pendingPause, setPendingPause] = useState<number | null>(null);

    useEffect(() => {
        setName(currentTitle);
    }, [currentTitle]);

    useEffect(() => {
        setPauseMinutes(timeSpanToMinutes(breakDuration));
    }, [breakDuration]);

    function handleOpen(e: MouseEvent<HTMLButtonElement>) {
        e.stopPropagation();
        setOpen(true);
    }

    function handleSave(event: FormEvent) {
        event.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            setError("Le nom est obligatoire.");
            return;
        }
        setError("");

        if (trimmed !== currentTitle) {
            setPendingName(trimmed);
            setPendingPause(!Number.isNaN(pauseMinutes) ? pauseMinutes : null);
            setConfirmAction("rename");
            return;
        }
        if (!Number.isNaN(pauseMinutes)) {
            itineraryModel.setSegmentBreakDuration(segmentId, pauseMinutes);
        }
        setOpen(false);
    }

    function handleDelete() {
        setPendingName(name.trim());
        setPendingPause(null);
        setConfirmAction("delete");
    }

    function confirmProceed() {
        if (confirmAction === "rename" && pendingName) {
            itineraryModel.renameSegment(segmentId, pendingName);
            if (pendingPause !== null) {
                itineraryModel.setSegmentBreakDuration(segmentId, pendingPause);
            }
        } else if (confirmAction === "delete") {
            itineraryModel.removeSegment(segmentId);
        }
        setConfirmAction(null);
        setOpen(false);
    }

    function cancelConfirm() {
        setConfirmAction(null);
    }

    const confirmationMessageSeg =
        confirmAction === "delete"
            ? "Supprimer définitivement ce segment ?"
            : "Confirmer le renommage du segment ?";

    return (
        <>
            <button
                type="button"
                className="item-action-btn"
                aria-haspopup="dialog"
                aria-label="Actions sur le segment"
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={handleOpen}
            >
                <Settings size={18} color="#BB487C"/>
            </button>
            <Modal open={open} onClose={() => setOpen(false)} title="Actions sur le segment">
                <form className="action-form" onSubmit={handleSave}>
                    <label>
                        Nom du segment
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (error) setError("");
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            placeholder="Renommer le segment"
                            autoFocus
                        />
                    </label>
                    {error && <p className="input-error">{error}</p>}
                    <label className="pause-row">
                        <span className="pause-label">
                            <Clock3 size={16}/> Temps de pause (minutes)
                        </span>
                        <input
                            type="number"
                            min={0}
                            step={5}
                            value={pauseMinutes}
                            onChange={(e) => setPauseMinutes(Number(e.target.value))}
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                        />
                    </label>
                    <div className="modal-actions">
                        <button type="submit" className="primary-btn">
                            <Save size={16}/> Enregistrer
                        </button>
                        <button type="button" className="danger-btn" onClick={handleDelete}>
                            <Trash2 size={16}/> Supprimer
                        </button>
                        <button type="button" className="ghost-btn" onClick={() => setOpen(false)}>
                            Annuler
                        </button>
                    </div>
                </form>
            </Modal>
            <Modal
                open={confirmAction !== null}
                onClose={cancelConfirm}
                title="Confirmer l'action"
            >
                <div className="confirm-dialog">
                    <div className="confirm-header">
                        <AlertTriangle size={18} color="#BB487C"/>
                        <p>{confirmationMessageSeg}</p>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="primary-btn" onClick={confirmProceed}>
                            OK
                        </button>
                        <button type="button" className="ghost-btn" onClick={cancelConfirm}>
                            Annuler
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
