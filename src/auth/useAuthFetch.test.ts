import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { AuthProvider } from './AuthContext';
import { useAuthFetch } from './useAuthFetch';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

function wrapper({ children }: { children: ReactNode }) {
    return createElement(AuthProvider, null, children);
}

describe('useAuthFetch', () => {
    beforeEach(() => {
        localStorage.clear();
        mockNavigate.mockReset();
        vi.stubGlobal('fetch', vi.fn());
    });

    it('ajoute le header Authorization quand un token est présent', async () => {
        localStorage.setItem('auth_token', 'test-token');
        vi.mocked(fetch).mockResolvedValueOnce({ status: 200, ok: true } as Response);

        const { result } = renderHook(() => useAuthFetch(), { wrapper });

        await act(async () => {
            await result.current('http://api/endpoint', { method: 'GET' });
        });

        expect(fetch).toHaveBeenCalledWith(
            'http://api/endpoint',
            expect.objectContaining({
                headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
            })
        );
    });

    it("n'ajoute pas le header Authorization sans token", async () => {
        vi.mocked(fetch).mockResolvedValueOnce({ status: 200, ok: true } as Response);

        const { result } = renderHook(() => useAuthFetch(), { wrapper });

        await act(async () => {
            await result.current('http://api/endpoint', {
                headers: { 'Content-Type': 'application/json' },
            });
        });

        const callHeaders = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
        expect(callHeaders.Authorization).toBeUndefined();
    });

    it('appelle logout et redirige vers /login sur réponse 401', async () => {
        localStorage.setItem('auth_token', 'expired-token');
        vi.mocked(fetch).mockResolvedValueOnce({ status: 401, ok: false } as Response);

        const { result } = renderHook(() => useAuthFetch(), { wrapper });

        await act(async () => {
            await result.current('http://api/endpoint');
        });

        expect(localStorage.getItem('auth_token')).toBeNull();
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it("ne redirige pas sur d'autres erreurs", async () => {
        localStorage.setItem('auth_token', 'test-token');
        vi.mocked(fetch).mockResolvedValueOnce({ status: 403, ok: false } as Response);

        const { result } = renderHook(() => useAuthFetch(), { wrapper });

        await act(async () => {
            await result.current('http://api/endpoint');
        });

        expect(mockNavigate).not.toHaveBeenCalled();
        expect(localStorage.getItem('auth_token')).toBe('test-token');
    });

    it('préserve les headers existants', async () => {
        localStorage.setItem('auth_token', 'test-token');
        vi.mocked(fetch).mockResolvedValueOnce({ status: 200, ok: true } as Response);

        const { result } = renderHook(() => useAuthFetch(), { wrapper });

        await act(async () => {
            await result.current('http://api/endpoint', {
                headers: { 'Content-Type': 'application/json' },
            });
        });

        expect(fetch).toHaveBeenCalledWith(
            'http://api/endpoint',
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer test-token',
                }),
            })
        );
    });
});
