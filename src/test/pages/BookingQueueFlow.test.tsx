import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AUTH_TOKEN_KEY } from '../../auth/storage';
import { server } from '../setup';
import { EventDetailPage } from '../../pages/EventDetailPage';
import { QueuePage } from '../../pages/QueuePage';

function renderBookingFlow(route = '/events/1') {
  const router = createMemoryRouter(
    [
      {
        path: '/events/:eventId',
        element: <EventDetailPage />,
      },
      {
        path: '/events/:eventId/seats/queue',
        element: <QueuePage />,
      },
      {
        path: '/events/:eventId/seats',
        element: <div>좌석 선택 페이지</div>,
      },
      {
        path: '/login',
        element: <div>로그인 페이지</div>,
      },
    ],
    { initialEntries: [route] }
  );

  render(<RouterProvider router={router} />);
}

describe('Booking queue flow', () => {
  it('예매 클릭 후 대기열 화면을 거쳐 좌석 선택 페이지로 진입한다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.setItem(AUTH_TOKEN_KEY, 'jwt-token');

    let checkCount = 0;
    server.use(
      http.get('http://localhost:8080/api/v1/events/1', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            id: 1,
            title: 'Load Test Event',
            category: 'CONCERT',
            startAt: '2026-05-01T19:00:00',
            endAt: '2026-05-01T22:00:00',
            venue: 'Seoul Arena',
          },
        })
      ),
      http.post('http://localhost:8080/api/v1/queue/events/1', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            token: 'queue-token-1',
            phase: 'WAITING',
            position: 3,
            remainingSeconds: 0,
          },
        })
      ),
      http.get('http://localhost:8080/api/v1/queue/events/1', () => {
        checkCount += 1;

        if (checkCount === 1) {
          return HttpResponse.json({
            code: 200,
            status: 'OK',
            message: 'OK',
            data: {
              token: 'queue-token-1',
              phase: 'WAITING',
              position: 3,
              remainingSeconds: 0,
            },
          });
        }

        if (checkCount === 2) {
          return HttpResponse.json({
            code: 200,
            status: 'OK',
            message: 'OK',
            data: {
              token: 'queue-token-1',
              phase: 'WAITING',
              position: 1,
              remainingSeconds: 0,
            },
          });
        }

        return HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            token: 'queue-token-1',
            phase: 'ALLOWED',
            position: 0,
            remainingSeconds: 580,
          },
        });
      })
    );

    renderBookingFlow();

    await userEvent.click(await screen.findByRole('button', { name: '예매하기' }));

    expect(await screen.findByText('예매 대기 중입니다')).toBeInTheDocument();
    expect(await screen.findByText('3번째 순서입니다.')).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(2000);
    expect(await screen.findByText('1번째 순서입니다.')).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(2000);
    expect(await screen.findByText('좌석 선택 페이지')).toBeInTheDocument();

    vi.useRealTimers();
  });
});
