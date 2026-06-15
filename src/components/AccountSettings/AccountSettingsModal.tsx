import { type MouseEvent, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Lock, AlertTriangle, Trash2 } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { useAuthFetch } from '../../auth/useAuthFetch';
import { validatePassword } from '../../auth/passwordValidation';
import './AccountSettingsModal.css';
import { BACKEND_URL } from '../../config';

interface AccountSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
}

export function AccountSettingsModal({ isOpen, onClose, onLogout }: AccountSettingsModalProps) {
    const { email, login } = useAuth();
    const authFetch = useAuthFetch();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        // Validate inputs
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            setMessage({ type: 'error', text: 'Tous les champs sont requis' });
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas' });
            return;
        }

        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            setMessage({ type: 'error', text: passwordError });
            return;
        }

        setLoading(true);
        try {
            const response = await authFetch(`${BACKEND_URL}/auth/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            if (response.ok) {
                const data = await response.json().catch(() => ({}));
                if (data.token) {
                    login(data.token);
                }
                setMessage({ type: 'success', text: 'Mot de passe mis à jour avec succès' });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
                setTimeout(() => {
                    setMessage(null);
                }, 3000);
            } else {
                const errorData = await response.json().catch(() => ({}));
                setMessage({
                    type: 'error',
                    text: errorData.error || errorData.message || 'Erreur lors de la mise à jour du mot de passe'
                });
            }
        } catch {
            setMessage({
                type: 'error',
                text: 'Erreur de connexion au serveur'
            });
        } finally {
            setLoading(false);
        }
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setDeletePassword('');
        setDeleteError(null);
    };

    /**
     * Supprime définitivement le compte après confirmation par mot de passe
     * (DELETE /auth/account). En cas de succès, déconnecte l'utilisateur.
     */
    const handleDeleteAccount = async () => {
        setDeleteError(null);

        if (!deletePassword) {
            setDeleteError('Veuillez entrer votre mot de passe');
            return;
        }

        setDeleteLoading(true);
        try {
            const response = await authFetch(`${BACKEND_URL}/auth/account`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: deletePassword })
            });

            if (response.ok) {
                onLogout();
            } else {
                const errorData = await response.json().catch(() => ({}));
                setDeleteError(errorData.error || errorData.message || 'Erreur lors de la suppression du compte');
            }
        } catch {
            setDeleteError('Erreur de connexion au serveur');
        } finally {
            setDeleteLoading(false);
        }
    };

    return createPortal(
        <div
            className="account-settings-modal-overlay"
            role="button"
            aria-label="Fermer"
            tabIndex={0}
            onClick={handleOverlayClick}
            onKeyDown={handleKeyDown}
        >
            <div className="account-settings-modal" role="dialog" aria-modal="true">
                {/* Header */}
                <div className="account-settings-modal-header">
                    <h2>
                        <User size={18} />
                        Paramètres du compte
                    </h2>
                    <button className="account-settings-modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="account-settings-modal-content">
                    {/* Section Informations */}
                    <div className="account-settings-section">
                        <div className="account-settings-section-title">
                            Informations
                        </div>

                        <div className="account-settings-form-group">
                            <label className="account-settings-label" htmlFor="account-settings-email">
                                Adresse email
                            </label>
                            <input
                                id="account-settings-email"
                                type="email"
                                className="account-settings-input"
                                value={email ?? ''}
                                readOnly
                            />
                        </div>
                    </div>

                    {/* Section Change Password */}
                    <div className="account-settings-section">
                        <div className="account-settings-section-title">
                            <Lock size={16} />
                            Changer le mot de passe
                        </div>

                        {message && (
                            <div className={`account-settings-message account-settings-message-${message.type}`}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleChangePassword}>
                            <div className="account-settings-form-group">
                                <label className="account-settings-label" htmlFor="account-settings-current-password">
                                    Mot de passe actuel
                                </label>
                                <input
                                    id="account-settings-current-password"
                                    type="password"
                                    className="account-settings-input"
                                    placeholder="Entrez votre mot de passe actuel"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            <div className="account-settings-form-group">
                                <label className="account-settings-label" htmlFor="account-settings-new-password">
                                    Nouveau mot de passe
                                </label>
                                <input
                                    id="account-settings-new-password"
                                    type="password"
                                    className="account-settings-input"
                                    placeholder="Entrez votre nouveau mot de passe"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            <div className="account-settings-form-group">
                                <label className="account-settings-label" htmlFor="account-settings-confirm-password">
                                    Confirmer le nouveau mot de passe
                                </label>
                                <input
                                    id="account-settings-confirm-password"
                                    type="password"
                                    className="account-settings-input"
                                    placeholder="Confirmez votre nouveau mot de passe"
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                className="account-settings-btn account-settings-btn-submit"
                                disabled={loading}
                            >
                                {loading ? 'Mise à jour...' : 'Mettre à jour'}
                            </button>
                        </form>
                    </div>

                    {/* Section Danger Zone */}
                    <div className="account-settings-section account-settings-danger">
                        <div className="account-settings-section-title">
                            <AlertTriangle size={16} />
                            Zone de danger
                        </div>

                        {!showDeleteConfirm ? (
                            <button
                                type="button"
                                className="account-settings-btn account-settings-btn-delete"
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                <Trash2 size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                                Supprimer mon compte
                            </button>
                        ) : (
                            <div className="account-settings-delete-confirm">
                                <p className="account-settings-delete-warning">
                                    Cette action est irréversible : votre compte et tous vos convois seront définitivement supprimés. Entrez votre mot de passe pour confirmer.
                                </p>

                                {deleteError && (
                                    <div className="account-settings-message account-settings-message-error">
                                        {deleteError}
                                    </div>
                                )}

                                <div className="account-settings-form-group">
                                    <label className="account-settings-label" htmlFor="account-settings-delete-password">
                                        Mot de passe
                                    </label>
                                    <input
                                        id="account-settings-delete-password"
                                        type="password"
                                        className="account-settings-input"
                                        placeholder="Entrez votre mot de passe"
                                        value={deletePassword}
                                        onChange={(e) => setDeletePassword(e.target.value)}
                                        disabled={deleteLoading}
                                    />
                                </div>

                                <div className="account-settings-delete-actions">
                                    <button
                                        type="button"
                                        className="account-settings-btn account-settings-btn-cancel"
                                        onClick={cancelDelete}
                                        disabled={deleteLoading}
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="button"
                                        className="account-settings-btn account-settings-btn-delete-confirm"
                                        onClick={handleDeleteAccount}
                                        disabled={deleteLoading}
                                    >
                                        {deleteLoading ? 'Suppression...' : 'Confirmer la suppression'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="account-settings-modal-footer">
                    <button
                        className="account-settings-btn account-settings-btn-logout"
                        onClick={onLogout}
                    >
                        Se déconnecter
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
