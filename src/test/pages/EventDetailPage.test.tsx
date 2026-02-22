import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { getGlobalUiState } from '../../components/globalUiStore';
import { AUTH_TOKEN_KEY } from '../../auth/storage';
import { server } from '../setup';
import { EventDetailPage } from '../../pages/EventDetailPage';
import { mockEvent } from '../../mocks/mockData';

function renderPage(route = '/events/1', state?: Record<string, unknown>) {
  const router = createMemoryRouter(
    [
      {
        path: '/events/:eventId',
        element: <EventDetailPage />,
      },
      {
        path: '/events/:eventId/seats',
        element: <div>좌석 선택 페이지</div>,
      },
      {
        path: '/events/:eventId/seats/queue',
        element: <div>대기열 페이지</div>,
      },
      {
        path: '/login',
        element: <div>로그인 페이지</div>,
      },
    ],
    {
      initialEntries: state
        ? [{ pathname: route, state }]
        : [route],
    }
  );

  render(<RouterProvider router={router} />);
}

describe('EventDetailPage', () => {
  it('인증 없이 이벤트 상세 정보를 렌더링하고 우측 캘린더/예매 버튼을 표시', async () => {
    server.use(
      http.get('http://localhost:8080/api/v1/events/1', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            id: 1,
            title: 'Public Event',
            category: 'CONCERT',
            startAt: '2026-05-01T19:00:00',
            endAt: '2026-05-01T22:00:00',
            venue: 'Seoul Arena',
          },
        })
      )
    );

    renderPage();

    expect(await screen.findByText('Public Event')).toBeInTheDocument();
    expect(screen.getByText('Seoul Arena')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Public Event 포스터' })).toHaveAttribute('src', '/sample-poster.svg');
    expect(screen.getByRole('button', { name: '예매하기' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '관람일' })).toBeInTheDocument();
    expect(screen.queryByText('좌석 선택 시작')).not.toBeInTheDocument();
    expect(screen.queryByText('대기열 확인 후 좌석 선택 페이지로 이동합니다.')).not.toBeInTheDocument();
  });

  it('imageUrl만 있어도 상세 포스터 이미지를 렌더링', async () => {
    server.use(
      http.get('http://localhost:8080/api/v1/events/1', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            id: 1,
            title: 'ImageUrl Event',
            category: 'CONCERT',
            startAt: '2026-05-01T19:00:00',
            endAt: '2026-05-01T22:00:00',
            venue: 'Seoul Arena',
            imageUrl: '/images/events/event-1.jpg',
          },
        })
      )
    );

    renderPage();

    expect(await screen.findByRole('img', { name: 'ImageUrl Event 포스터' })).toHaveAttribute(
      'src',
      'http://localhost:8080/images/events/event-1.jpg'
    );
  });

  it('단일일 이벤트는 캘린더에서 해당 날짜만 선택 강조', async () => {
    server.use(
      http.get('http://localhost:8080/api/v1/events/1', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            id: 1,
            title: 'Single Day Event',
            category: 'CONCERT',
            startAt: '2026-05-30T19:00:00',
            endAt: '2026-05-30T22:00:00',
            venue: 'Seoul Arena',
          },
        })
      )
    );

    renderPage();

    const selectedDays = await screen.findAllByRole('button', { name: '30' });
    expect(selectedDays.some((button) => button.className.includes('event-calendar__day--selected'))).toBe(true);
  });

  it('다중일 이벤트는 범위 하이라이트와 선택일 변경이 가능', async () => {
    server.use(
      http.get('http://localhost:8080/api/v1/events/1', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            id: 1,
            title: 'Multi Day Event',
            category: 'CONCERT',
            startAt: '2026-05-30T19:00:00',
            endAt: '2026-06-01T22:00:00',
            venue: 'Seoul Arena',
          },
        })
      )
    );

    renderPage();

    const day31 = await screen.findByRole('button', { name: '31' });
    await userEvent.click(day31);

    expect(day31.className).toContain('event-calendar__day--selected');
    expect(await screen.findByText(/선택일:/)).toBeInTheDocument();
  });

  it('미로그인 상태에서 예매하기 버튼 클릭 시 로그인 페이지로 이동', async () => {
    server.use(
      http.get('http://localhost:8080/api/v1/events/1', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            id: 1,
            title: 'Public Event',
            category: 'CONCERT',
            startAt: '2026-05-01T19:00:00',
            endAt: '2026-05-01T22:00:00',
            venue: 'Seoul Arena',
          },
        })
      )
    );

    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: '예매하기' }));

    expect(await screen.findByText('로그인 페이지')).toBeInTheDocument();
  });

  it('예매 버튼 클릭 후 enterQueue가 ALLOWED면 좌석 선택 페이지로 이동', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'jwt-token');

    server.use(
      http.get('http://localhost:8080/api/v1/events/1', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            id: 1,
            title: 'Public Event',
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
            token: 'queue-token',
            phase: 'ALLOWED',
            position: 0,
            remainingSeconds: 590,
          },
        })
      )
    );

    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: '예매하기' }));

    expect(await screen.findByText('좌석 선택 페이지')).toBeInTheDocument();
  });

  it('예매 버튼 클릭 후 enterQueue가 WAITING이면 대기열 페이지로 이동', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'jwt-token');

    server.use(
      http.get('http://localhost:8080/api/v1/events/1', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            id: 1,
            title: 'Public Event',
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
            token: 'queue-token',
            phase: 'WAITING',
            position: 3,
            remainingSeconds: 0,
          },
        })
      )
    );

    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: '예매하기' }));

    expect(await screen.findByText('대기열 페이지')).toBeInTheDocument();
  });

  it('좌석 세션 만료 state로 진입하면 상세 상단에 안내를 표시', async () => {
    server.use(
      http.get('http://localhost:8080/api/v1/events/1', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            id: 1,
            title: 'Expired Session Event',
            category: 'CONCERT',
            startAt: '2026-05-01T19:00:00',
            endAt: '2026-05-01T22:00:00',
            venue: 'Seoul Arena',
          },
        })
      )
    );

    renderPage('/events/1', {
      seatSessionExpired: true,
      reason: '좌석 선택 시간이 만료되었습니다.',
    });

    expect(await screen.findByText('좌석 선택 시간이 만료되었습니다.')).toBeInTheDocument();
  });

  it('이벤트 상세 조회가 401이면 세션 만료 프롬프트를 요청', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'expired-jwt');
    server.use(
      http.get('http://localhost:8080/api/v1/events/1', () =>
        HttpResponse.json(
          {
            code: 401,
            status: 'UNAUTHORIZED',
            message: '세션이 만료되었습니다.',
            data: null,
          },
          { status: 401 }
        )
      )
    );

    renderPage();
    await screen.findByText('이벤트 상세 정보를 불러오지 못했습니다.');

    expect(getGlobalUiState().sessionExpiredPrompt).toEqual({
      fromPath: '/events/1',
      requiresAuthRoute: false,
    });
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('expired-jwt');
  });

  it('이벤트 상세 조회가 일반 에러면 상단 배너 메시지를 설정', async () => {
    server.use(
      http.get('http://localhost:8080/api/v1/events/1', () =>
        HttpResponse.json(
          {
            code: 500,
            status: 'INTERNAL_SERVER_ERROR',
            message: '일시적인 오류입니다.',
            data: null,
          },
          { status: 500 }
        )
      )
    );

    renderPage();
    await screen.findByText(mockEvent.title);

    expect(getGlobalUiState().banner).toEqual({
      tone: 'info',
      message: '실서버 API에 연결할 수 없어 목 데이터를 표시합니다.',
    });
  });
});
