import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ForgotPasswordPage from './ForgotPasswordPage';

function renderForgotPasswordPage() {
    return render(
        <MemoryRouter>
            <ForgotPasswordPage />
        </MemoryRouter>
    );
}

describe('ForgotPasswordPage', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    it('affiche le titre et le champ email', () => {
        renderForgotPasswordPage();
        expect(screen.getByText('Mot de passe oublié')).toBeInTheDocument();
        expect(screen.getByLabelText('Adresse email')).toBeInTheDocument();
    });

    it('affiche le lien retour à la connexion', () => {
        renderForgotPasswordPage();
        expect(screen.getByText('Retour à la connexion')).toBeInTheDocument();
    });

    it('affiche un message de succès après envoi réussi', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response);

        renderForgotPasswordPage();
        await user.type(screen.getByLabelText('Adresse email'), 'user@example.com');
        await user.click(screen.getByRole('button', { name: /recevoir le lien/i }));

        await waitFor(() => {
            expect(
                screen.getByText(/email de réinitialisation a été envoyé/i)
            ).toBeInTheDocument();
        });
        expect(screen.queryByLabelText('Adresse email')).not.toBeInTheDocument();
    });

    it('affiche une erreur si l\'API renvoie une erreur', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);

        renderForgotPasswordPage();
        await user.type(screen.getByLabelText('Adresse email'), 'user@example.com');
        await user.click(screen.getByRole('button', { name: /recevoir le lien/i }));

        await waitFor(() => {
            expect(screen.getByText("Une erreur s'est produite. Veuillez réessayer.")).toBeInTheDocument();
        });
    });

    it('affiche une erreur si le serveur est inaccessible', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

        renderForgotPasswordPage();
        await user.type(screen.getByLabelText('Adresse email'), 'user@example.com');
        await user.click(screen.getByRole('button', { name: /recevoir le lien/i }));

        await waitFor(() => {
            expect(screen.getByText('Impossible de joindre le serveur.')).toBeInTheDocument();
        });
    });

    it('désactive le bouton pendant le chargement', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockImplementation(() => new Promise(() => {}));

        renderForgotPasswordPage();
        await user.type(screen.getByLabelText('Adresse email'), 'user@example.com');
        await user.click(screen.getByRole('button', { name: /recevoir le lien/i }));

        expect(screen.getByRole('button', { name: /envoi en cours/i })).toBeDisabled();
    });

    it('envoie l\'email dans le body de la requête', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response);

        renderForgotPasswordPage();
        await user.type(screen.getByLabelText('Adresse email'), 'check@example.com');
        await user.click(screen.getByRole('button', { name: /recevoir le lien/i }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:8080/auth/forgot-password',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ email: 'check@example.com' }),
                })
            );
        });
    });
});
