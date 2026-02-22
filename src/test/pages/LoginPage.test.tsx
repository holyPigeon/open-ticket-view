import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AUTH_TOKEN_KEY } from '../../auth/storage';
import { RequireAuth } from '../../components/RequireAuth';
import { server } from '../setup';
import { LoginPage } from '../../pages/LoginPage';

function renderAuthFlow(initialEntries: string[]) {
  const router = createMemoryRouter(
    [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/',
        element: <div>홈 페이지</div>,
      },
      {
        element: <RequireAuth />,
        children: [
          {
            path: '/events/:eventId/seats',
            element: <div>Protected Seats Page</div>,
          },
          {
            path: '/events/:eventId/seats/queue',
            element: <div>Protected Queue Page</div>,
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
    renderAuthFlow(['/events/1/seats']);

    expect(await screen.findByRole('heading', { name: '로그인' })).toBeInTheDocument();
  });

  it('비로그인 사용자가 대기열 경로에 접근하면 로그인으로 리다이렉트', async () => {
    renderAuthFlow(['/events/1/seats/queue']);

    expect(await screen.findByRole('heading', { name: '로그인' })).toBeInTheDocument();
  });

  it('비로그인 사용자가 루트 경로에 접근하면 홈 페이지 렌더링', async () => {
    renderAuthFlow(['/']);

    expect(await screen.findByText('홈 페이지')).toBeInTheDocument();
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

    renderAuthFlow(['/events/3/seats']);

    await userEvent.click(await screen.findByRole('button', { name: '로그인' }));

    expect(await screen.findByText('Protected Seats Page')).toBeInTheDocument();
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
