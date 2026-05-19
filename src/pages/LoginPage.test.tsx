import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import LoginPage from './LoginPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

function renderLoginPage(locationState?: { message: string }) {
    return render(
        <MemoryRouter initialEntries={[{ pathname: '/login', state: locationState ?? null }]}>
            <AuthProvider>
                <LoginPage />
            </AuthProvider>
        </MemoryRouter>
    );
}

describe('LoginPage', () => {
    beforeEach(() => {
        localStorage.clear();
        mockNavigate.mockReset();
        vi.stubGlobal('fetch', vi.fn());
    });

    it('affiche le champ email et mot de passe', () => {
        renderLoginPage();
        expect(screen.getByLabelText('Adresse email')).toBeInTheDocument();
        expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();
    });

    it('affiche le lien mot de passe oublié', () => {
        renderLoginPage();
        expect(screen.getByText('Mot de passe oublié ?')).toBeInTheDocument();
    });

    it('affiche le lien vers la page inscription', () => {
        renderLoginPage();
        expect(screen.getByText('Créer un compte')).toBeInTheDocument();
    });

    it('affiche le message de notice depuis le state de location', () => {
        renderLoginPage({ message: 'Compte créé avec succès.' });
        expect(screen.getByText('Compte créé avec succès.')).toBeInTheDocument();
    });

    it('connexion réussie → navigue vers /', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ token: 'jwt-token' }),
        } as Response);

        renderLoginPage();
        await user.type(screen.getByLabelText('Adresse email'), 'test@example.com');
        await user.type(screen.getByLabelText('Mot de passe'), 'password123');
        await user.click(screen.getByRole('button', { name: /se connecter/i }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
        });
        expect(localStorage.getItem('auth_token')).toBe('jwt-token');
        expect(localStorage.getItem('auth_email')).toBe('test@example.com');
    });

    it('affiche une erreur si les identifiants sont incorrects', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);

        renderLoginPage();
        await user.type(screen.getByLabelText('Adresse email'), 'bad@example.com');
        await user.type(screen.getByLabelText('Mot de passe'), 'wrong');
        await user.click(screen.getByRole('button', { name: /se connecter/i }));

        await waitFor(() => {
            expect(screen.getByText('Identifiants incorrects. Veuillez réessayer.')).toBeInTheDocument();
        });
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('affiche une erreur si le serveur est inaccessible', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

        renderLoginPage();
        await user.type(screen.getByLabelText('Adresse email'), 'test@example.com');
        await user.type(screen.getByLabelText('Mot de passe'), 'password');
        await user.click(screen.getByRole('button', { name: /se connecter/i }));

        await waitFor(() => {
            expect(screen.getByText('Impossible de joindre le serveur. Vérifiez votre connexion.')).toBeInTheDocument();
        });
    });

    it('désactive le bouton pendant le chargement', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockImplementation(() => new Promise(() => {}));

        renderLoginPage();
        await user.type(screen.getByLabelText('Adresse email'), 'test@example.com');
        await user.type(screen.getByLabelText('Mot de passe'), 'password');
        await user.click(screen.getByRole('button', { name: /se connecter/i }));

        expect(screen.getByRole('button', { name: /connexion en cours/i })).toBeDisabled();
    });

    it('envoie la requête fetch avec email et mot de passe', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ token: 'jwt' }),
        } as Response);

        renderLoginPage();
        await user.type(screen.getByLabelText('Adresse email'), 'user@test.com');
        await user.type(screen.getByLabelText('Mot de passe'), 'pass');
        await user.click(screen.getByRole('button', { name: /se connecter/i }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:8080/auth/login',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ email: 'user@test.com', password: 'pass' }),
                })
            );
        });
    });
});
