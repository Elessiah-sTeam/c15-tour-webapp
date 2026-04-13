import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from './AuthContext';
import { useAuth } from './useAuth';

// Composant de test pour accéder au contexte
function TestConsumer() {
  const { token, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="token">{token ?? 'null'}</span>
      <button onClick={() => login('test-token')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('initialise token à null si localStorage vide', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    expect(screen.getByTestId('token').textContent).toBe('null');
  });

  it('initialise token depuis localStorage', () => {
    localStorage.setItem('auth_token', 'stored-token');
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    expect(screen.getByTestId('token').textContent).toBe('stored-token');
  });

  it('login() stocke le token et met à jour l\'état', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await user.click(screen.getByText('Login'));
    expect(screen.getByTestId('token').textContent).toBe('test-token');
    expect(localStorage.getItem('auth_token')).toBe('test-token');
  });

  it('logout() supprime le token et met à jour l\'état', async () => {
    const user = userEvent.setup();
    localStorage.setItem('auth_token', 'existing-token');
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await user.click(screen.getByText('Logout'));
    expect(screen.getByTestId('token').textContent).toBe('null');
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('renvoie les enfants correctement', () => {
    render(
      <AuthProvider>
        <span data-testid="child">enfant</span>
      </AuthProvider>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});

describe('useAuth()', () => {
  it('lance une erreur si utilisé hors AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useAuth must be used inside AuthProvider');
    spy.mockRestore();
  });
});
