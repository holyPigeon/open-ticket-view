import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { server } from '../test/setup';
import { EventDetailPage } from './EventDetailPage';

function renderPage(route = '/events/1') {
  const router = createMemoryRouter(
    [
      {
        path: '/events/:eventId',
        element: <EventDetailPage />,
      },
    ],
    { initialEntries: [route] }
  );

  render(<RouterProvider router={router} />);
}

describe('EventDetailPage', () => {
  it('loads and renders event metadata from live API', async () => {
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
        })
      )
    );

    renderPage();

    expect(await screen.findByText('Live Event')).toBeInTheDocument();
    expect(screen.getByText('Seoul Arena')).toBeInTheDocument();
  });

  it('selects seats and updates booking summary', async () => {
    server.use(
      http.get('http://localhost:8080/api/v1/events/1', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            id: 1,
            title: 'Seat Test Event',
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
                title: 'Seat Test Event',
                category: 'CONCERT',
                startAt: '2026-05-01T19:00:00',
                endAt: '2026-05-01T22:00:00',
                venue: 'Seoul Arena',
              },
              seatNumber: 'A2',
              price: 150000,
              status: 'AVAILABLE',
            },
            {
              id: 3,
              event: {
                id: 1,
                title: 'Seat Test Event',
                category: 'CONCERT',
                startAt: '2026-05-01T19:00:00',
                endAt: '2026-05-01T22:00:00',
                venue: 'Seoul Arena',
              },
              seatNumber: 'A3',
              price: 150000,
              status: 'AVAILABLE',
            },
          ],
        })
      )
    );

    renderPage();

    const seatButton = await screen.findByRole('button', { name: 'A2 예약 가능' });
    await userEvent.click(seatButton);

    expect(screen.getByText('1개 좌석 선택됨')).toBeInTheDocument();
    expect(screen.getByText('₩150,000')).toBeInTheDocument();
  });

  it('disables booking button when no seats selected', async () => {
    server.use(
      http.get('http://localhost:8080/api/v1/events/1', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            id: 1,
            title: 'Booking Disabled Event',
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
      )
    );

    renderPage();

    const button = await screen.findByRole('button', { name: '선택 좌석 예매하기' });
    expect(button).toBeDisabled();
  });

  it('shows booking error banner on failed booking POST', async () => {
    server.use(
      http.get('http://localhost:8080/api/v1/events/1', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            id: 1,
            title: 'Booking Failure Event',
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
                title: 'Booking Failure Event',
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
      http.post('http://localhost:8080/api/v1/bookings', () =>
        HttpResponse.json(
          {
            code: 400,
            status: 'BAD_REQUEST',
            message: 'Queue token is invalid',
            data: null,
          },
          { status: 400 }
        )
      )
    );

    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'A2 예약 가능' }));
    await userEvent.click(screen.getByRole('button', { name: '선택 좌석 예매하기' }));

    expect(await screen.findByText('Queue token is invalid')).toBeInTheDocument();
  });

  it('falls back to mock mode when live API is unavailable', async () => {
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
