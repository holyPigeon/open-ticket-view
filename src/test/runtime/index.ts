import { normalizeLocalStorage } from './normalizeLocalStorage';
import { normalizeRequestApis } from './normalizeRequestApis';

export function setupTestRuntime(): void {
  normalizeLocalStorage();
  normalizeRequestApis();
}
