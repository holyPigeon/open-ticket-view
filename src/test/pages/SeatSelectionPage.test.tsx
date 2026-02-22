import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { RouterProvider, createMemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { getQueueToken, setQueueToken } from '../../auth/queueStorage';
import { server } from '../setup';
import { SeatSelectionPage } from '../../pages/SeatSelectionPage';

function EventDetailFallback() {
  const location = useLocation();
  const state = (location.state as { seatSessionExpired?: boolean; reason?: string } | null) ?? null;

  return (
    <div>
      <p>이벤트 상세 페이지</p>
      {state?.seatSessionExpired ? <p>{state.reason}</p> : null}
    </div>
  );
}

function renderPage(route = '/events/1/seats') {
  const router = createMemoryRouter(
    [
      {
        path: '/events/:eventId/seats',
        element: <SeatSelectionPage />,
      },
      {
        path: '/events/:eventId',
        element: <EventDetailFallback />,
      },
      {
        path: '/events/:eventId/seats/queue',
        element: <div>대기열 페이지</div>,
      },
      {
        path: '/',
        element: <div>홈 페이지</div>,
      },
    ],
    { initialEntries: [route] }
  );

  render(<RouterProvider router={router} />);
}

describe('SeatSelectionPage', () => {
  it('유효한 queue token이 있을 때 라이브 상세/좌석을 렌더링', async () => {
    setQueueToken(1, 'queue-token-1');

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

  it('queue token 없이 직접 진입하면 이벤트 상세 페이지로 이동', async () => {
    let seatsRequestCount = 0;
    server.use(
      http.get('http://localhost:8080/api/v1/events/1/seats', () => {
        seatsRequestCount += 1;
        return HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: [],
        });
      })
    );

    renderPage();

    expect(await screen.findByText('이벤트 상세 페이지')).toBeInTheDocument();
    expect(seatsRequestCount).toBe(0);
  });

  it('예매 요청에 queue token과 event id 헤더를 함께 전송', async () => {
    setQueueToken(1, 'queue-token-1');

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

  it('좌석 조회에서 queue token 만료 오류 시 이벤트 상세 페이지로 이동', async () => {
    setQueueToken(1, 'expired-token');
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    server.use(
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
      http.get('http://localhost:8080/api/v1/events/1/seats', () =>
        HttpResponse.json(
          {
            code: 400,
            status: 'BAD_REQUEST',
            message: '대기열 토큰이 유효하지 않거나 만료되었습니다.',
            data: null,
          },
          { status: 400 }
        )
      )
    );

    renderPage();

    expect(await screen.findByText('이벤트 상세 페이지')).toBeInTheDocument();
    expect(await screen.findByText('대기열 토큰이 유효하지 않거나 만료되었습니다.')).toBeInTheDocument();
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(getQueueToken(1)).toBeNull();
    confirmSpy.mockRestore();
  });

  it('앱 내 이동을 취소하면 현재 페이지에 머물고 queue token을 유지', async () => {
    setQueueToken(1, 'queue-token-1');
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    let leaveCallCount = 0;

    server.use(
      http.post('http://localhost:8080/api/v1/queue/events/1/leave', () => {
        leaveCallCount += 1;
        return HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            left: true,
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
            title: 'Guard Event',
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
          data: [],
        })
      ),
      http.get('http://localhost:8080/api/v1/queue/events/1', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            token: 'queue-token-2',
            phase: 'ALLOWED',
            position: 0,
            remainingSeconds: 300,
          },
        })
      )
    );

    renderPage();

    expect(await screen.findByText('Guard Event')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: '홈으로 이동' }));

    expect(screen.queryByText('홈 페이지')).not.toBeInTheDocument();
    expect(screen.getByText('Guard Event')).toBeInTheDocument();
    expect(getQueueToken(1)).toBe('queue-token-2');
    expect(leaveCallCount).toBe(0);
    confirmSpy.mockRestore();
  });

  it('앱 내 이동을 확정하면 queue token을 삭제하고 이동', async () => {
    setQueueToken(1, 'queue-token-1');
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    let leaveCallCount = 0;
    let leaveRequestBody: unknown = null;

    server.use(
      http.post('http://localhost:8080/api/v1/queue/events/1/leave', async ({ request }) => {
        leaveCallCount += 1;
        leaveRequestBody = await request.json();

        return HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            left: true,
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
            title: 'Leave Event',
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
              id: 4,
              event: {
                id: 1,
                title: 'Leave Event',
                category: 'CONCERT',
                startAt: '2026-05-01T19:00:00',
                endAt: '2026-05-01T22:00:00',
                venue: 'Seoul Arena',
              },
              seatNumber: 'B4',
              price: 150000,
              status: 'AVAILABLE',
            },
          ],
        })
      )
    );

    renderPage();

    expect(await screen.findByText('Leave Event')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: '홈으로 이동' }));

    expect(await screen.findByText('홈 페이지')).toBeInTheDocument();
    expect(getQueueToken(1)).toBeNull();
    expect(leaveCallCount).toBe(1);
    expect(leaveRequestBody).toEqual({ queueToken: 'queue-token-1' });
    confirmSpy.mockRestore();
  });

  it('beforeunload 시 queue token을 삭제하고 unload 경고를 설정', async () => {
    setQueueToken(1, 'queue-token-1');
    let leaveCallCount = 0;
    let keepaliveUsed = false;

    server.use(
      http.post('http://localhost:8080/api/v1/queue/events/1/leave', ({ request }) => {
        leaveCallCount += 1;
        keepaliveUsed = request.keepalive;

        return HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            left: true,
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
            title: 'Unload Event',
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
              id: 5,
              event: {
                id: 1,
                title: 'Unload Event',
                category: 'CONCERT',
                startAt: '2026-05-01T19:00:00',
                endAt: '2026-05-01T22:00:00',
                venue: 'Seoul Arena',
              },
              seatNumber: 'C1',
              price: 170000,
              status: 'AVAILABLE',
            },
          ],
        })
      )
    );

    renderPage();
    expect(await screen.findByText('Unload Event')).toBeInTheDocument();

    const beforeUnloadEvent = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(beforeUnloadEvent);

    expect(beforeUnloadEvent.defaultPrevented).toBe(true);
    await waitFor(() => {
      expect(leaveCallCount).toBe(1);
      expect(keepaliveUsed).toBe(true);
    });
    expect(getQueueToken(1)).toBeNull();
  });

  it('leave API 실패 시에도 앱 내 이동을 계속 진행하고 queue token을 삭제', async () => {
    setQueueToken(1, 'queue-token-1');
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    server.use(
      http.post('http://localhost:8080/api/v1/queue/events/1/leave', () =>
        HttpResponse.json(
          {
            code: 500,
            status: 'INTERNAL_SERVER_ERROR',
            message: 'leave failed',
            data: null,
          },
          { status: 500 }
        )
      ),
      http.get('http://localhost:8080/api/v1/events/1', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            id: 1,
            title: 'Leave Failure Event',
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
              id: 6,
              event: {
                id: 1,
                title: 'Leave Failure Event',
                category: 'CONCERT',
                startAt: '2026-05-01T19:00:00',
                endAt: '2026-05-01T22:00:00',
                venue: 'Seoul Arena',
              },
              seatNumber: 'D1',
              price: 170000,
              status: 'AVAILABLE',
            },
          ],
        })
      )
    );

    renderPage();

    expect(await screen.findByText('Leave Failure Event')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: '홈으로 이동' }));

    expect(await screen.findByText('홈 페이지')).toBeInTheDocument();
    expect(getQueueToken(1)).toBeNull();
    confirmSpy.mockRestore();
  });

  it('좌석이 비어 있으면 queue 상태를 재검증하고 ALLOWED면 1회 재조회한다', async () => {
    setQueueToken(1, 'queue-token-1');
    let seatsCallCount = 0;

    server.use(
      http.get('http://localhost:8080/api/v1/events/1', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            id: 1,
            title: 'Retry Event',
            category: 'CONCERT',
            startAt: '2026-05-01T19:00:00',
            endAt: '2026-05-01T22:00:00',
            venue: 'Seoul Arena',
          },
        })
      ),
      http.get('http://localhost:8080/api/v1/events/1/seats', ({ request }) => {
        seatsCallCount += 1;

        if (seatsCallCount === 1) {
          expect(request.headers.get('x-queue-token')).toBe('queue-token-1');
          return HttpResponse.json({
            code: 200,
            status: 'OK',
            message: 'OK',
            data: [],
          });
        }

        expect(request.headers.get('x-queue-token')).toBe('queue-token-2');
        return HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: [
            {
              id: 7,
              event: {
                id: 1,
                title: 'Retry Event',
                category: 'CONCERT',
                startAt: '2026-05-01T19:00:00',
                endAt: '2026-05-01T22:00:00',
                venue: 'Seoul Arena',
              },
              seatNumber: 'B2',
              price: 120000,
              status: 'AVAILABLE',
            },
          ],
        });
      }),
      http.get('http://localhost:8080/api/v1/queue/events/1', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            token: 'queue-token-2',
            phase: 'ALLOWED',
            position: 0,
            remainingSeconds: 300,
          },
        })
      )
    );

    renderPage();

    expect(await screen.findByRole('button', { name: 'B2 예약 가능' })).toBeInTheDocument();
    expect(seatsCallCount).toBe(2);
  });

  it('좌석이 비어 있고 queue가 WAITING이면 대기열 페이지로 이동', async () => {
    setQueueToken(1, 'queue-token-1');

    server.use(
      http.get('http://localhost:8080/api/v1/events/1', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            id: 1,
            title: 'Waiting Event',
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
          data: [],
        })
      ),
      http.get('http://localhost:8080/api/v1/queue/events/1', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            token: 'queue-token-2',
            phase: 'WAITING',
            position: 4,
            remainingSeconds: 0,
          },
        })
      )
    );

    renderPage();

    expect(await screen.findByText('대기열 페이지')).toBeInTheDocument();
  });

  it('재조회 후에도 좌석이 비어 있으면 빈 좌석 그리드를 표시', async () => {
    setQueueToken(1, 'queue-token-1');

    server.use(
      http.get('http://localhost:8080/api/v1/events/1', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            id: 1,
            title: 'Empty Event',
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
          data: [],
        })
      ),
      http.get('http://localhost:8080/api/v1/queue/events/1', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            token: 'queue-token-2',
            phase: 'ALLOWED',
            position: 0,
            remainingSeconds: 300,
          },
        })
      )
    );

    renderPage();

    expect(await screen.findByText('Empty Event')).toBeInTheDocument();
    expect(screen.getByText('현재 선택 가능한 좌석이 없습니다.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '대기열 다시 확인' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /예약 가능|예약 중|판매 완료/ })).not.toBeInTheDocument();
  });

  it('라이브 API 장애 시 오류 메시지를 표시', async () => {
    setQueueToken(1, 'queue-token-1');

    server.use(
      http.get('http://localhost:8080/api/v1/events/1', () => HttpResponse.error()),
      http.get('http://localhost:8080/api/v1/events/1/seats', () => HttpResponse.error())
    );

    renderPage();

    expect(await screen.findByText('좌석 선택')).toBeInTheDocument();
    expect(screen.queryByText('이벤트 상세 페이지')).not.toBeInTheDocument();
  });

  it('대기열 토큰 필요 오류 시 이벤트 상세로 이동', async () => {
    setQueueToken(1, 'queue-token-1');

    server.use(
      http.get('http://localhost:8080/api/v1/events/1', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            id: 1,
            title: 'Token Required Event',
            category: 'CONCERT',
            startAt: '2026-05-01T19:00:00',
            endAt: '2026-05-01T22:00:00',
            venue: 'Seoul Arena',
          },
        })
      ),
      http.get('http://localhost:8080/api/v1/events/1/seats', () =>
        HttpResponse.json(
          {
            code: 400,
            status: 'BAD_REQUEST',
            message: '대기열 토큰이 필요합니다.',
            data: null,
          },
          { status: 400 }
        )
      )
    );

    renderPage();

    expect(await screen.findByText('이벤트 상세 페이지')).toBeInTheDocument();
  });

  it('라이브 좌석이 모두 예약 불가이면 해당 좌석들을 비활성 상태로 그대로 표시', async () => {
    setQueueToken(1, 'queue-token-1');

    server.use(
      http.get('http://localhost:8080/api/v1/events/1', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            id: 1,
            title: 'Sold Out Event',
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
                title: 'Sold Out Event',
                category: 'CONCERT',
                startAt: '2026-05-01T19:00:00',
                endAt: '2026-05-01T22:00:00',
                venue: 'Seoul Arena',
              },
              seatNumber: 'A2',
              price: 150000,
              status: 'BOOKED',
            },
            {
              id: 3,
              event: {
                id: 1,
                title: 'Sold Out Event',
                category: 'CONCERT',
                startAt: '2026-05-01T19:00:00',
                endAt: '2026-05-01T22:00:00',
                venue: 'Seoul Arena',
              },
              seatNumber: 'A3',
              price: 150000,
              status: 'BOOKED',
            },
          ],
        })
      )
    );

    renderPage();

    const seatA2 = await screen.findByRole('button', { name: 'A2 예약 중' });
    const seatA3 = await screen.findByRole('button', { name: 'A3 예약 중' });

    expect(seatA2).toBeDisabled();
    expect(seatA3).toBeDisabled();
    expect(screen.queryByText('현재 선택 가능한 좌석이 없습니다.')).not.toBeInTheDocument();
  });
});
