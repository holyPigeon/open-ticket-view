import { describe, expect, it } from 'vitest';
import { buildRequestHeaders } from './client';

describe('buildRequestHeaders', () => {
  it('includes auth, queue and event headers when provided', () => {
    const headers = buildRequestHeaders({
      authToken: 'abc',
      queueToken: 'q-1',
      eventId: 7,
    }) as Record<string, string>;

    expect(headers.Authorization).toBe('Bearer abc');
    expect(headers['X-Queue-Token']).toBe('q-1');
    expect(headers['X-Event-Id']).toBe('7');
  });
});
