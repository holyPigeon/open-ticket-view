import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../test/setup';
import { login } from './openTicketApi';

describe('login API', () => {
  it('sends JSON body and parses login response envelope', async () => {
    let contentType = '';
    let body: unknown;

    server.use(
      http.post('http://localhost:8080/api/v1/auth/login', async ({ request }) => {
        contentType = request.headers.get('content-type') ?? '';
        body = await request.json();

        return HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: { token: 'jwt-123' },
        });
      })
    );

    const response = await login({ email: 'user1@gmail.com', password: 'password1' });

    expect(contentType).toContain('application/json');
    expect(body).toEqual({ email: 'user1@gmail.com', password: 'password1' });
    expect(response.token).toBe('jwt-123');
  });
});
