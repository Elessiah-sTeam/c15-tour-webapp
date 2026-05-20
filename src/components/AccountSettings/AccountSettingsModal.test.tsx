import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../auth/AuthContext';
import { AccountSettingsModal } from './AccountSettingsModal';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

function renderModal(props: { isOpen?: boolean; onClose?: () => void; onLogout?: () => void } = {}) {
    const { isOpen = true, onClose = vi.fn(), onLogout = vi.fn() } = props;
    return render(
        <MemoryRouter>
            <AuthProvider>
                <AccountSettingsModal isOpen={isOpen} onClose={onClose} onLogout={onLogout} />
            </AuthProvider>
        </MemoryRouter>
    );
}

function renderModalWithEmail(email: string, props: { onClose?: () => void; onLogout?: () => void } = {}) {
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('auth_email', email);
    return renderModal(props);
}

describe('AccountSettingsModal', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.stubGlobal('fetch', vi.fn());
    });

    it('ne rend rien quand isOpen=false', () => {
        renderModal({ isOpen: false });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('affiche le modal quand isOpen=true', () => {
        renderModal();
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Paramètres du compte')).toBeInTheDocument();
    });

    it('affiche l\'email de l\'utilisateur connecté', () => {
        renderModalWithEmail('user@example.com');
        const emailInput = screen.getByLabelText('Adresse email') as HTMLInputElement;
        expect(emailInput.value).toBe('user@example.com');
        expect(emailInput).toHaveAttribute('readonly');
    });

    it('appelle onClose au clic sur le bouton fermer', async () => {
        const onClose = vi.fn();
        const user = userEvent.setup();
        renderModal({ onClose });
        await user.click(screen.getByRole('button', { name: '✕' }));
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('appelle onClose au clic sur l\'overlay', async () => {
        const onClose = vi.fn();
        const user = userEvent.setup();
        renderModal({ onClose });
        const overlay = document.querySelector('.account-settings-modal-overlay') as HTMLElement;
        await user.click(overlay);
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('appelle onClose sur la touche Escape', () => {
        const onClose = vi.fn();
        renderModal({ onClose });
        const overlay = document.querySelector('.account-settings-modal-overlay') as HTMLElement;
        fireEvent.keyDown(overlay, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('appelle onLogout au clic sur le bouton se déconnecter', async () => {
        const onLogout = vi.fn();
        const user = userEvent.setup();
        renderModal({ onLogout });
        await user.click(screen.getByRole('button', { name: /se déconnecter/i }));
        expect(onLogout).toHaveBeenCalledOnce();
    });

    it('affiche une erreur si les champs sont vides au submit', async () => {
        const user = userEvent.setup();
        renderModal();
        await user.click(screen.getByRole('button', { name: /mettre à jour/i }));
        expect(screen.getByText('Tous les champs sont requis')).toBeInTheDocument();
    });

    it('affiche une erreur si les nouveaux mots de passe ne correspondent pas', async () => {
        const user = userEvent.setup();
        renderModal();
        await user.type(screen.getByLabelText('Mot de passe actuel'), 'oldpass');
        await user.type(screen.getByLabelText('Nouveau mot de passe'), 'Newpass1');
        await user.type(screen.getByLabelText('Confirmer le nouveau mot de passe'), 'Newpass2');
        await user.click(screen.getByRole('button', { name: /mettre à jour/i }));
        expect(screen.getByText('Les nouveaux mots de passe ne correspondent pas')).toBeInTheDocument();
    });

    it('affiche une erreur si le nouveau mot de passe est trop court', async () => {
        const user = userEvent.setup();
        renderModal();
        await user.type(screen.getByLabelText('Mot de passe actuel'), 'oldpass');
        await user.type(screen.getByLabelText('Nouveau mot de passe'), 'short');
        await user.type(screen.getByLabelText('Confirmer le nouveau mot de passe'), 'short');
        await user.click(screen.getByRole('button', { name: /mettre à jour/i }));
        expect(screen.getByText(/au moins 8 caractères/i)).toBeInTheDocument();
    });

    it('affiche une erreur si le nouveau mot de passe ne respecte pas la complexité', async () => {
        const user = userEvent.setup();
        renderModal();
        await user.type(screen.getByLabelText('Mot de passe actuel'), 'oldpass');
        await user.type(screen.getByLabelText('Nouveau mot de passe'), 'password1');
        await user.type(screen.getByLabelText('Confirmer le nouveau mot de passe'), 'password1');
        await user.click(screen.getByRole('button', { name: /mettre à jour/i }));
        expect(screen.getByText(/majuscule/i)).toBeInTheDocument();
        expect(fetch).not.toHaveBeenCalled();
    });

    it('affiche un message de succès après changement de mot de passe réussi', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Password updated successfully', token: 'new-jwt' }),
        } as Response);
        renderModalWithEmail('user@example.com');

        await user.type(screen.getByLabelText('Mot de passe actuel'), 'oldpassword');
        await user.type(screen.getByLabelText('Nouveau mot de passe'), 'Newpass1');
        await user.type(screen.getByLabelText('Confirmer le nouveau mot de passe'), 'Newpass1');
        await user.click(screen.getByRole('button', { name: /mettre à jour/i }));

        await waitFor(() => {
            expect(screen.getByText('Mot de passe mis à jour avec succès')).toBeInTheDocument();
        });
    });

    it('affiche une erreur si l\'API renvoie une erreur', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ message: 'Mot de passe actuel incorrect' }),
        } as Response);
        renderModalWithEmail('user@example.com');

        await user.type(screen.getByLabelText('Mot de passe actuel'), 'wrongpass');
        await user.type(screen.getByLabelText('Nouveau mot de passe'), 'Newpass1');
        await user.type(screen.getByLabelText('Confirmer le nouveau mot de passe'), 'Newpass1');
        await user.click(screen.getByRole('button', { name: /mettre à jour/i }));

        await waitFor(() => {
            expect(screen.getByText('Mot de passe actuel incorrect')).toBeInTheDocument();
        });
    });

    it('affiche une erreur générique si l\'API échoue sans message', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: false,
            json: async () => ({}),
        } as Response);
        renderModal();

        await user.type(screen.getByLabelText('Mot de passe actuel'), 'oldpassword');
        await user.type(screen.getByLabelText('Nouveau mot de passe'), 'Newpass1');
        await user.type(screen.getByLabelText('Confirmer le nouveau mot de passe'), 'Newpass1');
        await user.click(screen.getByRole('button', { name: /mettre à jour/i }));

        await waitFor(() => {
            expect(screen.getByText('Erreur lors de la mise à jour du mot de passe')).toBeInTheDocument();
        });
    });

    it('affiche une erreur si le serveur est inaccessible', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));
        renderModal();

        await user.type(screen.getByLabelText('Mot de passe actuel'), 'oldpassword');
        await user.type(screen.getByLabelText('Nouveau mot de passe'), 'Newpass1');
        await user.type(screen.getByLabelText('Confirmer le nouveau mot de passe'), 'Newpass1');
        await user.click(screen.getByRole('button', { name: /mettre à jour/i }));

        await waitFor(() => {
            expect(screen.getByText('Erreur de connexion au serveur')).toBeInTheDocument();
        });
    });

    it('envoie le token Authorization dans la requête', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Password updated successfully', token: 'new-jwt' }),
        } as Response);
        renderModalWithEmail('user@example.com');

        await user.type(screen.getByLabelText('Mot de passe actuel'), 'oldpassword');
        await user.type(screen.getByLabelText('Nouveau mot de passe'), 'Newpass1');
        await user.type(screen.getByLabelText('Confirmer le nouveau mot de passe'), 'Newpass1');
        await user.click(screen.getByRole('button', { name: /mettre à jour/i }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:8080/auth/change-password',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer test-token',
                    }),
                })
            );
        });
    });

    it('remplace le JWT stocké avec le nouveau token retourné', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Password updated successfully', token: 'new-jwt' }),
        } as Response);
        renderModalWithEmail('user@example.com');

        await user.type(screen.getByLabelText('Mot de passe actuel'), 'oldpassword');
        await user.type(screen.getByLabelText('Nouveau mot de passe'), 'Newpass1');
        await user.type(screen.getByLabelText('Confirmer le nouveau mot de passe'), 'Newpass1');
        await user.click(screen.getByRole('button', { name: /mettre à jour/i }));

        await waitFor(() => {
            expect(localStorage.getItem('auth_token')).toBe('new-jwt');
        });
        expect(screen.getByText('Mot de passe mis à jour avec succès')).toBeInTheDocument();
    });

    it('déconnecte et redirige vers /login sur réponse 403 (token absent)', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockResolvedValueOnce({ status: 403, ok: false } as Response);
        renderModalWithEmail('user@example.com');

        await user.type(screen.getByLabelText('Mot de passe actuel'), 'oldpassword');
        await user.type(screen.getByLabelText('Nouveau mot de passe'), 'Newpass1');
        await user.type(screen.getByLabelText('Confirmer le nouveau mot de passe'), 'Newpass1');
        await user.click(screen.getByRole('button', { name: /mettre à jour/i }));

        await waitFor(() => {
            expect(localStorage.getItem('auth_token')).toBeNull();
        });
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
});
