import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setQueueToken } from '../../auth/queueStorage';
import { AUTH_TOKEN_KEY } from '../../auth/storage';
import { server } from '../setup';
import { QueuePage } from '../../pages/QueuePage';

function renderQueuePage(initialEntries: string[] = ['/events/1/seats/queue'], tokenState?: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/events/:eventId/seats/queue',
        element: <QueuePage />,
      },
      {
        path: '/events/:eventId/seats',
        element: <div>좌석 선택 페이지</div>,
      },
      {
        path: '/events/:eventId',
        element: <div>이벤트 상세 페이지</div>,
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

    renderQueuePage(['/events/1/seats/queue'], 'queue-token-1');

    expect(await screen.findByText('4번째 순서입니다.')).toBeInTheDocument();
    expect(document.querySelector('.queue-loader')).toBeInTheDocument();
    expect(document.querySelector('.queue-position--animated')).toBeInTheDocument();
    expect(screen.getByText('2초마다 순서를 갱신합니다.')).toBeInTheDocument();
    expect(screen.getByText(/마지막 갱신:/)).toBeInTheDocument();
  });

  it('2초마다 checkStatus polling을 수행', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
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

    renderQueuePage(['/events/1/seats/queue'], 'queue-token-1');
    await screen.findByText('2번째 순서입니다.');

    await vi.advanceTimersByTimeAsync(2000);

    await waitFor(() => {
      expect(checkCount).toBeGreaterThanOrEqual(2);
    });
  });

  it('polling 응답에 따라 대기 순번이 51에서 50으로 갱신된다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.setItem(AUTH_TOKEN_KEY, 'jwt');

    let checkCount = 0;
    server.use(
      http.get('http://localhost:8080/api/v1/queue/events/1', () => {
        checkCount += 1;
        const position = checkCount === 1 ? 51 : 50;

        return HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            token: 'queue-token-1',
            phase: 'WAITING',
            position,
            remainingSeconds: 0,
          },
        });
      })
    );

    renderQueuePage(['/events/1/seats/queue'], 'queue-token-1');
    expect(await screen.findByText('51번째 순서입니다.')).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(2000);

    expect(await screen.findByText('50번째 순서입니다.')).toBeInTheDocument();
    expect(screen.getByText(/마지막 갱신:/)).toBeInTheDocument();
  });

  it('ALLOWED가 되면 좌석 선택 페이지로 리다이렉트', async () => {
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

    renderQueuePage(['/events/1/seats/queue'], 'queue-token-1');

    expect(await screen.findByText('좌석 선택 페이지')).toBeInTheDocument();
  });

  it('토큰 없이 대기열 페이지 접근 시 이벤트 상세로 이동', async () => {
    renderQueuePage(['/events/1/seats/queue']);

    expect(await screen.findByText('이벤트 상세 페이지')).toBeInTheDocument();
  });

  it('토큰 무효 응답 시 이벤트 상세 페이지로 이동', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'jwt');
    setQueueToken(1, 'expired-token');

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
      )
    );

    renderQueuePage(['/events/1/seats/queue']);

    expect(await screen.findByText('이벤트 상세 페이지')).toBeInTheDocument();
  });
});
