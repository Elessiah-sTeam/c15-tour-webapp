import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ResetPasswordPage from './ResetPasswordPage';

function renderWithToken(token?: string) {
    const url = token ? `/reset-password?token=${token}` : '/reset-password';
    return render(
        <MemoryRouter initialEntries={[url]}>
            <ResetPasswordPage />
        </MemoryRouter>
    );
}

describe('ResetPasswordPage', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    it('affiche un message d\'erreur si aucun token dans l\'URL', () => {
        renderWithToken();
        expect(screen.getByText('Lien invalide')).toBeInTheDocument();
        expect(screen.getByText(/lien invalide ou expiré/i)).toBeInTheDocument();
        expect(screen.getByText('Retour à la réinitialisation')).toBeInTheDocument();
    });

    it('affiche le formulaire si un token est présent', () => {
        renderWithToken('valid-token-abc');
        expect(screen.getByText('Réinitialiser le mot de passe')).toBeInTheDocument();
        expect(screen.getByLabelText('Nouveau mot de passe')).toBeInTheDocument();
        expect(screen.getByLabelText('Confirmer le mot de passe')).toBeInTheDocument();
    });

    it('affiche une erreur si les mots de passe ne correspondent pas', async () => {
        const user = userEvent.setup();
        renderWithToken('abc123');

        await user.type(screen.getByLabelText('Nouveau mot de passe'), 'password1');
        await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'password2');
        await user.click(screen.getByRole('button', { name: /réinitialiser/i }));

        expect(screen.getByText('Les mots de passe ne correspondent pas.')).toBeInTheDocument();
        expect(fetch).not.toHaveBeenCalled();
    });

    it('réinitialisation réussie → affiche message de succès', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response);

        renderWithToken('valid-token');
        await user.type(screen.getByLabelText('Nouveau mot de passe'), 'newpass123');
        await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'newpass123');
        await user.click(screen.getByRole('button', { name: /réinitialiser/i }));

        await waitFor(() => {
            expect(screen.getByText('Mot de passe réinitialisé avec succès !')).toBeInTheDocument();
        });
        expect(screen.getByText('Se connecter')).toBeInTheDocument();
    });

    it('affiche une erreur si l\'API échoue', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);

        renderWithToken('valid-token');
        await user.type(screen.getByLabelText('Nouveau mot de passe'), 'newpass123');
        await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'newpass123');
        await user.click(screen.getByRole('button', { name: /réinitialiser/i }));

        await waitFor(() => {
            expect(
                screen.getByText('Impossible de réinitialiser le mot de passe. Veuillez réessayer.')
            ).toBeInTheDocument();
        });
    });

    it('affiche une erreur si le serveur est inaccessible', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

        renderWithToken('valid-token');
        await user.type(screen.getByLabelText('Nouveau mot de passe'), 'newpass123');
        await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'newpass123');
        await user.click(screen.getByRole('button', { name: /réinitialiser/i }));

        await waitFor(() => {
            expect(
                screen.getByText('Impossible de joindre le serveur. Vérifiez votre connexion.')
            ).toBeInTheDocument();
        });
    });

    it('désactive le bouton pendant le chargement', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockImplementation(() => new Promise(() => {}));

        renderWithToken('valid-token');
        await user.type(screen.getByLabelText('Nouveau mot de passe'), 'newpass123');
        await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'newpass123');
        await user.click(screen.getByRole('button', { name: /réinitialiser/i }));

        expect(screen.getByRole('button', { name: /traitement en cours/i })).toBeDisabled();
    });

    it('envoie le token et le nouveau mot de passe dans la requête', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response);

        renderWithToken('mytoken');
        await user.type(screen.getByLabelText('Nouveau mot de passe'), 'secret');
        await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'secret');
        await user.click(screen.getByRole('button', { name: /réinitialiser/i }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:8080/auth/reset-password',
                expect.objectContaining({
                    body: JSON.stringify({ token: 'mytoken', newPassword: 'secret' }),
                })
            );
        });
    });
});
