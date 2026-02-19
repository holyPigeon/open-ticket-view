import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AUTH_TOKEN_KEY } from '../auth/storage';
import { server } from '../test/setup';
import { QueuePage } from './QueuePage';

function renderQueuePage(initialEntries: string[] = ['/events/1/queue'], tokenState?: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/events/:eventId/queue',
        element: <QueuePage />,
      },
      {
        path: '/events/:eventId',
        element: <div>상세 페이지</div>,
      },
    ],
    {
      initialEntries: tokenState
        ? [{ pathname: initialEntries[0], state: { token: tokenState } }]
        : initialEntries,
    }
  );

  render(<RouterProvider router={router} />);
}

afterEach(() => {
  vi.useRealTimers();
});

describe('QueuePage', () => {
  it('WAITING 상태의 대기 정보를 표시', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'jwt');

    server.use(
      http.get('http://localhost:8080/api/v1/queue/events/1', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            token: 'queue-token-1',
            phase: 'WAITING',
            position: 4,
            remainingSeconds: 0,
          },
        })
      )
    );

    renderQueuePage(['/events/1/queue'], 'queue-token-1');

    expect(await screen.findByText('4번째 순서입니다.')).toBeInTheDocument();
    expect(screen.getByText('2초마다 순서를 갱신합니다.')).toBeInTheDocument();
  });

  it('2초마다 checkStatus polling을 수행', async () => {
    vi.useFakeTimers();
    localStorage.setItem(AUTH_TOKEN_KEY, 'jwt');

    let checkCount = 0;
    server.use(
      http.get('http://localhost:8080/api/v1/queue/events/1', () => {
        checkCount += 1;

        return HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            token: 'queue-token-1',
            phase: 'WAITING',
            position: 2,
            remainingSeconds: 0,
          },
        });
      })
    );

    renderQueuePage(['/events/1/queue'], 'queue-token-1');
    await screen.findByText('2번째 순서입니다.');

    await vi.advanceTimersByTimeAsync(2000);

    await waitFor(() => {
      expect(checkCount).toBeGreaterThanOrEqual(2);
    });
  });

  it('ALLOWED가 되면 상세 페이지로 리다이렉트', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'jwt');

    server.use(
      http.get('http://localhost:8080/api/v1/queue/events/1', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            token: 'queue-token-1',
            phase: 'ALLOWED',
            position: 0,
            remainingSeconds: 590,
          },
        })
      )
    );

    renderQueuePage(['/events/1/queue'], 'queue-token-1');

    expect(await screen.findByText('상세 페이지')).toBeInTheDocument();
  });

  it('토큰 무효 응답 시 enterQueue로 재진입', async () => {
    vi.useFakeTimers();
    localStorage.setItem(AUTH_TOKEN_KEY, 'jwt');

    let enterCount = 0;
    server.use(
      http.get('http://localhost:8080/api/v1/queue/events/1', () =>
        HttpResponse.json(
          {
            code: 400,
            status: 'BAD_REQUEST',
            message: '유효하지 않은 대기열 토큰입니다.',
            data: null,
          },
          { status: 400 }
        )
      ),
      http.post('http://localhost:8080/api/v1/queue/events/1', () => {
        enterCount += 1;

        return HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            token: 'queue-token-2',
            phase: 'WAITING',
            position: 7,
            remainingSeconds: 0,
          },
        });
      })
    );

    renderQueuePage(['/events/1/queue'], 'expired-token');

    await vi.advanceTimersByTimeAsync(2000);

    await waitFor(() => {
      expect(enterCount).toBeGreaterThan(0);
    });
  });
});
