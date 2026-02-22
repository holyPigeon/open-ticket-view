import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { resetGlobalUiState } from '../components/globalUiStore';
import { setupTestRuntime } from './runtime';

export const server = setupServer();

setupTestRuntime();

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  resetGlobalUiState();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
