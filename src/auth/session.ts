import { ApiHttpError } from '../api/client';
import { clearSessionExpiredPrompt, requestSessionExpiredPrompt } from '../components/globalUiStore';
import { clearAllQueueTokens } from './queueStorage';
import { clearAuthToken } from './storage';

type SessionExpiredHandlingInput = {
  fromPath: string;
  requiresAuthRoute: boolean;
};

export function isSessionExpiredError(error: unknown): error is ApiHttpError {
  return error instanceof ApiHttpError && error.status === 401;
}

export function clearSession(): void {
  clearAuthToken();
  clearAllQueueTokens();
}

export function promptSessionExpired(input: SessionExpiredHandlingInput): void {
  requestSessionExpiredPrompt(input);
}

export function dismissSessionExpiredPrompt(): void {
  clearSessionExpiredPrompt();
}
