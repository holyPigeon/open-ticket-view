import { describe, expect, it } from 'vitest';
import { AUTH_TOKEN_KEY, clearAuthToken, getAuthToken, isAuthenticated, setAuthToken } from './storage';

describe('auth storage helpers', () => {
  it('stores and reads token from localStorage', () => {
    setAuthToken('jwt-token');

    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('jwt-token');
    expect(getAuthToken()).toBe('jwt-token');
    expect(isAuthenticated()).toBe(true);
  });

  it('clears token from localStorage', () => {
    setAuthToken('jwt-token');
    clearAuthToken();

    expect(getAuthToken()).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });
});
