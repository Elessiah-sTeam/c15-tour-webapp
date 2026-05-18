import { Save, Archive, Trash2, X } from "lucide-react";
import "./SaveDialog.css";

type Props = {
    onSave: () => void;
    onSaveDraft: () => void;
    onDiscard: () => void;
    onCancel: () => void;
};

export default function SaveDialog({ onSave, onSaveDraft, onDiscard, onCancel }: Props) {
    return (
        <div className="save-dialog-overlay" onClick={onCancel}>
            <div className="save-dialog" onClick={e => e.stopPropagation()}>
                <button className="save-dialog__close" onClick={onCancel} aria-label="Annuler">
                    <X size={18} />
                </button>
                <p className="save-dialog__title">Enregistrer le convoi ?</p>
                <p className="save-dialog__subtitle">
                    Des modifications non enregistrées seront perdues si vous quittez.
                </p>
                <div className="save-dialog__actions">
                    <button className="save-dialog__btn save-dialog__btn--save" onClick={onSave}>
                        <Save size={16} />
                        Enregistrer
                    </button>
                    <button className="save-dialog__btn save-dialog__btn--draft" onClick={onSaveDraft}>
                        <Archive size={16} />
                        Enregistrer en brouillon
                    </button>
                    <button className="save-dialog__btn save-dialog__btn--discard" onClick={onDiscard}>
                        <Trash2 size={16} />
                        Ne pas enregistrer
                    </button>
                </div>
            </div>
        </div>
    );
}
