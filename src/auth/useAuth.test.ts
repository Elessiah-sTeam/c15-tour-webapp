import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getAuthToken } from './useAuth';

describe('getAuthToken()', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renvoie null si aucun token stocké', () => {
    expect(getAuthToken()).toBeNull();
  });

  it('renvoie le token si présent dans localStorage', () => {
    localStorage.setItem('auth_token', 'mon-token-jwt');
    expect(getAuthToken()).toBe('mon-token-jwt');
  });

  it('renvoie null après suppression du token', () => {
    localStorage.setItem('auth_token', 'token');
    localStorage.removeItem('auth_token');
    expect(getAuthToken()).toBeNull();
  });

  it('renvoie la valeur mise à jour si le token change', () => {
    localStorage.setItem('auth_token', 'ancien-token');
    localStorage.setItem('auth_token', 'nouveau-token');
    expect(getAuthToken()).toBe('nouveau-token');
  });
});
