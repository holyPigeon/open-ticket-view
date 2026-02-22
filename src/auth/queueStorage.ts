export const QUEUE_TOKEN_KEY_PREFIX = 'open-ticket:queue-token:';

function buildQueueTokenKey(eventId: number): string {
  return `${QUEUE_TOKEN_KEY_PREFIX}${eventId}`;
}

export function getQueueToken(eventId: number): string | null {
  return localStorage.getItem(buildQueueTokenKey(eventId));
}

export function setQueueToken(eventId: number, token: string): void {
  localStorage.setItem(buildQueueTokenKey(eventId), token);
}

export function clearQueueToken(eventId: number): void {
  localStorage.removeItem(buildQueueTokenKey(eventId));
}

export function clearAllQueueTokens(): void {
  const keysToRemove: string[] = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && key.startsWith(QUEUE_TOKEN_KEY_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => {
    localStorage.removeItem(key);
  });
}
