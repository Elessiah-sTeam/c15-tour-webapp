import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import RegisterPage from './RegisterPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

function renderRegisterPage() {
    return render(
        <MemoryRouter>
            <AuthProvider>
                <RegisterPage />
            </AuthProvider>
        </MemoryRouter>
    );
}

async function fillForm(
    user: ReturnType<typeof userEvent.setup>,
    opts: { email?: string; password?: string; confirmPassword?: string } = {}
) {
    const {
        email = 'john@example.com',
        password = 'Password1',
        confirmPassword = 'Password1',
    } = opts;
    if (email) await user.type(screen.getByLabelText('Adresse email'), email);
    if (password) await user.type(screen.getByLabelText('Mot de passe'), password);
    if (confirmPassword) await user.type(screen.getByLabelText('Confirmer le mot de passe'), confirmPassword);
}

describe('RegisterPage', () => {
    beforeEach(() => {
        localStorage.clear();
        mockNavigate.mockReset();
        vi.stubGlobal('fetch', vi.fn());
    });

    it('affiche tous les champs du formulaire', () => {
        renderRegisterPage();
        expect(screen.getByLabelText('Adresse email')).toBeInTheDocument();
        expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();
        expect(screen.getByLabelText('Confirmer le mot de passe')).toBeInTheDocument();
        expect(screen.queryByLabelText('Identifiant')).not.toBeInTheDocument();
    });

    it('affiche le lien vers la page de connexion', () => {
        renderRegisterPage();
        expect(screen.getByText('Se connecter')).toBeInTheDocument();
    });

    it('affiche une erreur si les mots de passe ne correspondent pas', async () => {
        const user = userEvent.setup();
        renderRegisterPage();
        await fillForm(user, { password: 'Password1', confirmPassword: 'different' });
        await user.click(screen.getByRole('button', { name: /créer mon compte/i }));

        expect(screen.getByText('Les mots de passe ne correspondent pas.')).toBeInTheDocument();
        expect(fetch).not.toHaveBeenCalled();
    });

    it('affiche une erreur si le mot de passe ne respecte pas les règles de complexité', async () => {
        const user = userEvent.setup();
        renderRegisterPage();
        await fillForm(user, { password: 'password1', confirmPassword: 'password1' });
        await user.click(screen.getByRole('button', { name: /créer mon compte/i }));

        expect(screen.getByText(/majuscule/i)).toBeInTheDocument();
        expect(fetch).not.toHaveBeenCalled();
    });

    it('inscription réussie avec token → navigue vers /', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ token: 'new-token' }),
        } as Response);

        renderRegisterPage();
        await fillForm(user);
        await user.click(screen.getByRole('button', { name: /créer mon compte/i }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
        });
        expect(localStorage.getItem('auth_token')).toBe('new-token');
    });

    it('inscription réussie sans token → redirige vers /login avec message', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({}),
        } as Response);

        renderRegisterPage();
        await fillForm(user);
        await user.click(screen.getByRole('button', { name: /créer mon compte/i }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/login', {
                replace: true,
                state: { message: 'Compte créé avec succès. Vous pouvez vous connecter.' },
            });
        });
    });

    it('affiche une erreur si le serveur renvoie une erreur', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);

        renderRegisterPage();
        await fillForm(user);
        await user.click(screen.getByRole('button', { name: /créer mon compte/i }));

        await waitFor(() => {
            expect(screen.getByText('Impossible de créer le compte. Vérifiez vos informations.')).toBeInTheDocument();
        });
    });

    it('affiche une erreur si le serveur est inaccessible', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

        renderRegisterPage();
        await fillForm(user);
        await user.click(screen.getByRole('button', { name: /créer mon compte/i }));

        await waitFor(() => {
            expect(screen.getByText('Impossible de joindre le serveur. Vérifiez votre connexion.')).toBeInTheDocument();
        });
    });

    it('désactive le bouton pendant le chargement', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockImplementation(() => new Promise(() => {}));

        renderRegisterPage();
        await fillForm(user);
        await user.click(screen.getByRole('button', { name: /créer mon compte/i }));

        expect(screen.getByRole('button', { name: /création du compte/i })).toBeDisabled();
    });

    it('envoie email et password dans la requête (sans username)', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({}),
        } as Response);

        renderRegisterPage();
        await fillForm(user, { email: 'jdoe@test.com', password: 'Password1', confirmPassword: 'Password1' });
        await user.click(screen.getByRole('button', { name: /créer mon compte/i }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:8080/auth/register',
                expect.objectContaining({
                    body: JSON.stringify({ email: 'jdoe@test.com', password: 'Password1' }),
                })
            );
        });
    });

    it('affiche une erreur si l\'email est déjà utilisé (409)', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 409 } as Response);

        renderRegisterPage();
        await fillForm(user);
        await user.click(screen.getByRole('button', { name: /créer mon compte/i }));

        await waitFor(() => {
            expect(screen.getByText('Cette adresse email est déjà utilisée.')).toBeInTheDocument();
        });
    });
});
