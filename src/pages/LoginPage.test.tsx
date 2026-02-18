import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AUTH_TOKEN_KEY } from '../auth/storage';
import { RequireAuth } from '../components/RequireAuth';
import { server } from '../test/setup';
import { LoginPage } from './LoginPage';

function renderAuthFlow(initialEntries: string[]) {
  const router = createMemoryRouter(
    [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        element: <RequireAuth />,
        children: [
          {
            path: '/events/:eventId',
            element: <div>Protected Event Page</div>,
          },
        ],
      },
    ],
    { initialEntries }
  );

  render(<RouterProvider router={router} />);
}

describe('Login flow and route guard', () => {
  it('redirects unauthenticated user to login page', async () => {
    renderAuthFlow(['/events/1']);

    expect(await screen.findByRole('heading', { name: '로그인' })).toBeInTheDocument();
  });

  it('stores token and redirects to requested route after successful login', async () => {
    server.use(
      http.post('http://localhost:8080/api/v1/auth/login', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: { token: 'jwt-login' },
        })
      )
    );

    renderAuthFlow(['/events/3']);

    await userEvent.click(await screen.findByRole('button', { name: '로그인' }));

    expect(await screen.findByText('Protected Event Page')).toBeInTheDocument();
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('jwt-login');
  });

  it('shows inline error when login fails', async () => {
    server.use(
      http.post('http://localhost:8080/api/v1/auth/login', () =>
        HttpResponse.json(
          {
            code: 400,
            status: 'BAD_REQUEST',
            message: 'Invalid credentials',
            data: null,
          },
          { status: 400 }
        )
      )
    );

    renderAuthFlow(['/login']);

    await userEvent.click(await screen.findByRole('button', { name: '로그인' }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });
});
