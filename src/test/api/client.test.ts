import { z } from 'zod';
import { describe, expect, it, vi } from 'vitest';
import { ApiHttpError, TicketClient, buildRequestHeaders } from '../../api/client';

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

describe('TicketClient error handling', () => {
  it('throws ApiHttpError with status on GET failure', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: '세션이 만료되었습니다.' }),
    } as Response);

    const client = new TicketClient({ baseUrl: 'http://localhost:8080', authToken: 'jwt' });

    await expect(client.get('/api/v1/events/1', z.object({ id: z.number() }))).rejects.toMatchObject<ApiHttpError>({
      name: 'ApiHttpError',
      status: 401,
      message: '세션이 만료되었습니다.',
      path: '/api/v1/events/1',
    });

    fetchSpy.mockRestore();
  });
});
