import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { setQueueToken } from '../auth/queueStorage';
import { server } from '../test/setup';
import { EventDetailPage } from './EventDetailPage';

function renderPage(route = '/events/1') {
  const router = createMemoryRouter(
    [
      {
        path: '/events/:eventId',
        element: <EventDetailPage />,
      },
      {
        path: '/events/:eventId/queue',
        element: <div>대기열 페이지</div>,
      },
    ],
    { initialEntries: [route] }
  );

  render(<RouterProvider router={router} />);
}

function setupAllowedQueueToken(token = 'queue-token-1') {
  server.use(
    http.post('http://localhost:8080/api/v1/queue/events/1', () =>
      HttpResponse.json({
        code: 200,
        status: 'OK',
        message: 'OK',
        data: {
          token,
          phase: 'ALLOWED',
          position: 0,
          remainingSeconds: 590,
        },
      })
    )
  );
}

describe('EventDetailPage', () => {
  it('queue ALLOWED 후 라이브 상세/좌석을 렌더링', async () => {
    setupAllowedQueueToken();

    server.use(
      http.get('http://localhost:8080/api/v1/events/1', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            id: 1,
            title: 'Live Event',
            category: 'CONCERT',
            startAt: '2026-05-01T19:00:00',
            endAt: '2026-05-01T22:00:00',
            venue: 'Seoul Arena',
          },
        })
      ),
      http.get('http://localhost:8080/api/v1/events/1/seats', ({ request }) => {
        expect(request.headers.get('x-queue-token')).toBe('queue-token-1');
        expect(request.headers.get('x-event-id')).toBe('1');

        return HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: [
            {
              id: 2,
              event: {
                id: 1,
                title: 'Live Event',
                category: 'CONCERT',
                startAt: '2026-05-01T19:00:00',
                endAt: '2026-05-01T22:00:00',
                venue: 'Seoul Arena',
              },
              seatNumber: 'A2',
              price: 150000,
              status: 'AVAILABLE',
            },
          ],
        });
      })
    );

    renderPage();

    expect(await screen.findByText('Live Event')).toBeInTheDocument();
    expect(screen.getByText('Seoul Arena')).toBeInTheDocument();
  });

  it('enterQueue 결과가 WAITING이면 대기열 페이지로 이동', async () => {
    server.use(
      http.post('http://localhost:8080/api/v1/queue/events/1', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            token: 'waiting-token',
            phase: 'WAITING',
            position: 3,
            remainingSeconds: 0,
          },
        })
      )
    );

    renderPage();

    expect(await screen.findByText('대기열 페이지')).toBeInTheDocument();
  });

  it('예매 요청에 queue token과 event id 헤더를 함께 전송', async () => {
    setupAllowedQueueToken();

    server.use(
      http.get('http://localhost:8080/api/v1/events/1', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            id: 1,
            title: 'Booking Event',
            category: 'CONCERT',
            startAt: '2026-05-01T19:00:00',
            endAt: '2026-05-01T22:00:00',
            venue: 'Seoul Arena',
          },
        })
      ),
      http.get('http://localhost:8080/api/v1/events/1/seats', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: [
            {
              id: 2,
              event: {
                id: 1,
                title: 'Booking Event',
                category: 'CONCERT',
                startAt: '2026-05-01T19:00:00',
                endAt: '2026-05-01T22:00:00',
                venue: 'Seoul Arena',
              },
              seatNumber: 'A2',
              price: 150000,
              status: 'AVAILABLE',
            },
          ],
        })
      ),
      http.post('http://localhost:8080/api/v1/bookings', ({ request }) => {
        expect(request.headers.get('x-queue-token')).toBe('queue-token-1');
        expect(request.headers.get('x-event-id')).toBe('1');

        return HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            id: 99,
          },
        });
      })
    );

    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'A2 예약 가능' }));
    await userEvent.click(screen.getByRole('button', { name: '선택 좌석 예매하기' }));

    expect(await screen.findByText('예매가 완료되었습니다.')).toBeInTheDocument();
  });

  it('상세 조회에서 queue token 만료 오류 시 enterQueue 재진입 후 복구', async () => {
    setQueueToken(1, 'expired-token');

    let enterCount = 0;

    server.use(
      http.post('http://localhost:8080/api/v1/queue/events/1', () => {
        enterCount += 1;

        return HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            token: 'fresh-token',
            phase: 'ALLOWED',
            position: 0,
            remainingSeconds: 600,
          },
        });
      }),
      http.get('http://localhost:8080/api/v1/events/1', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            id: 1,
            title: 'Recovered Event',
            category: 'CONCERT',
            startAt: '2026-05-01T19:00:00',
            endAt: '2026-05-01T22:00:00',
            venue: 'Seoul Arena',
          },
        })
      ),
      http.get('http://localhost:8080/api/v1/events/1/seats', ({ request }) => {
        const token = request.headers.get('x-queue-token');

        if (token === 'expired-token') {
          return HttpResponse.json(
            {
              code: 400,
              status: 'BAD_REQUEST',
              message: '대기열 토큰이 유효하지 않거나 만료되었습니다.',
              data: null,
            },
            { status: 400 }
          );
        }

        return HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: [],
        });
      })
    );

    renderPage();

    expect(await screen.findByText('Recovered Event')).toBeInTheDocument();
    await waitFor(() => {
      expect(enterCount).toBe(1);
    });
  });

  it('라이브 API 장애 시 목 데이터로 fallback', async () => {
    setupAllowedQueueToken();

    server.use(
      http.get('http://localhost:8080/api/v1/events/1', () => HttpResponse.error()),
      http.get('http://localhost:8080/api/v1/events/1/seats', () => HttpResponse.error())
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('목 데이터 모드')).toBeInTheDocument();
    });
    expect(screen.getByText('실서버 API에 연결할 수 없어 목 데이터를 표시합니다.')).toBeInTheDocument();
  });
});
