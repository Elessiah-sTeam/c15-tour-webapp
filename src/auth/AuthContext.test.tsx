import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from './AuthContext';
import { useAuth } from './useAuth';

// Composant de test pour accéder au contexte
function TestConsumer() {
  const { token, email, login, logout, setEmail } = useAuth();
  return (
    <div>
      <span data-testid="token">{token ?? 'null'}</span>
      <span data-testid="email">{email ?? 'null'}</span>
      <button onClick={() => login('test-token')}>Login</button>
      <button onClick={() => login('test-token', 'user@example.com')}>Login With Email</button>
      <button onClick={() => setEmail('updated@example.com')}>Set Email</button>
      <button onClick={() => setEmail(null)}>Clear Email</button>
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

  it('initialise email à null si localStorage vide', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    expect(screen.getByTestId('email').textContent).toBe('null');
  });

  it('initialise email depuis localStorage', () => {
    localStorage.setItem('auth_email', 'stored@example.com');
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    expect(screen.getByTestId('email').textContent).toBe('stored@example.com');
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

  it('login() avec email stocke l\'email', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await user.click(screen.getByText('Login With Email'));
    expect(screen.getByTestId('email').textContent).toBe('user@example.com');
    expect(localStorage.getItem('auth_email')).toBe('user@example.com');
  });

  it('setEmail() met à jour l\'email dans le contexte et localStorage', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await user.click(screen.getByText('Set Email'));
    expect(screen.getByTestId('email').textContent).toBe('updated@example.com');
    expect(localStorage.getItem('auth_email')).toBe('updated@example.com');
  });

  it('setEmail(null) supprime l\'email du localStorage', async () => {
    const user = userEvent.setup();
    localStorage.setItem('auth_email', 'old@example.com');
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await user.click(screen.getByText('Clear Email'));
    expect(screen.getByTestId('email').textContent).toBe('null');
    expect(localStorage.getItem('auth_email')).toBeNull();
  });

  it('logout() supprime le token et l\'email', async () => {
    const user = userEvent.setup();
    localStorage.setItem('auth_token', 'existing-token');
    localStorage.setItem('auth_email', 'user@example.com');
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await user.click(screen.getByText('Logout'));
    expect(screen.getByTestId('token').textContent).toBe('null');
    expect(screen.getByTestId('email').textContent).toBe('null');
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('auth_email')).toBeNull();
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
