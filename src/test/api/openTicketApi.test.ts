import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../setup';
import { checkQueueStatus, enterQueue, fetchEventDetail, fetchEvents, leaveQueue, login } from '../../api/openTicketApi';

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

describe('events API', () => {
  it('이벤트 목록 페이지 응답을 파싱하고 쿼리 파라미터를 전달', async () => {
    let requestQuery = '';

    server.use(
      http.get('http://localhost:8080/api/v1/events', ({ request }) => {
        requestQuery = new URL(request.url).search;

        return HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            content: [
              {
                id: 1,
                title: '이벤트 A',
                category: 'CONCERT',
                startAt: '2026-05-01T19:00:00',
                endAt: '2026-05-01T22:00:00',
                venue: '잠실 주경기장',
                imageUrl: '/images/events/event-1.jpg',
              },
            ],
            pageable: {
              pageNumber: 0,
              pageSize: 12,
              offset: 0,
              paged: true,
              unpaged: false,
              sort: { sorted: true, unsorted: false, empty: false },
            },
            totalPages: 1,
            totalElements: 1,
            last: true,
            first: true,
            number: 0,
            size: 12,
            numberOfElements: 1,
            empty: false,
            sort: { sorted: true, unsorted: false, empty: false },
          },
        });
      })
    );

    const response = await fetchEvents({ page: 0, size: 12, sort: 'id,desc', title: '이벤트', category: 'CONCERT' });

    expect(response.content).toHaveLength(1);
    expect(response.content[0].title).toBe('이벤트 A');
    expect(response.content[0].posterImageUrl).toBe('http://localhost:8080/images/events/event-1.jpg');
    expect(requestQuery).toContain('page=0');
    expect(requestQuery).toContain('size=12');
    expect(requestQuery).toContain('sort=id%2Cdesc');
    expect(requestQuery).toContain('title=%EC%9D%B4%EB%B2%A4%ED%8A%B8');
    expect(requestQuery).toContain('category=CONCERT');
  });

  it('이벤트 상세 응답에서 imageUrl만 내려와도 posterImageUrl로 정규화', async () => {
    server.use(
      http.get('http://localhost:8080/api/v1/events/1', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            id: 1,
            title: '이벤트 상세 A',
            category: 'CONCERT',
            startAt: '2026-05-01T19:00:00',
            endAt: '2026-05-01T22:00:00',
            venue: '잠실 주경기장',
            imageUrl: '/images/events/event-1.jpg',
          },
        })
      )
    );

    const response = await fetchEventDetail(1);

    expect(response.posterImageUrl).toBe('http://localhost:8080/images/events/event-1.jpg');
  });
});

describe('queue API', () => {
  it('enterQueue가 토큰/phase를 파싱하고 Authorization 헤더를 전달', async () => {
    let authHeader = '';

    server.use(
      http.post('http://localhost:8080/api/v1/queue/events/1', ({ request }) => {
        authHeader = request.headers.get('authorization') ?? '';

        return HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            token: 'queue-token-1',
            phase: 'WAITING',
            position: 12,
            remainingSeconds: 0,
          },
        });
      })
    );

    const response = await enterQueue(1, 'jwt-token');

    expect(authHeader).toBe('Bearer jwt-token');
    expect(response.token).toBe('queue-token-1');
    expect(response.phase).toBe('WAITING');
    expect(response.position).toBe(12);
  });

  it('checkQueueStatus가 token query 파라미터를 전달하고 응답을 파싱', async () => {
    let requestQuery = '';

    server.use(
      http.get('http://localhost:8080/api/v1/queue/events/1', ({ request }) => {
        requestQuery = new URL(request.url).search;

        return HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            token: 'queue-token-1',
            phase: 'ALLOWED',
            position: 0,
            remainingSeconds: 590,
          },
        });
      })
    );

    const response = await checkQueueStatus(1, 'queue-token-1');

    expect(requestQuery).toContain('token=queue-token-1');
    expect(requestQuery).toMatch(/_ts=\d+/);
    expect(response.phase).toBe('ALLOWED');
    expect(response.remainingSeconds).toBe(590);
  });

  it('leaveQueue가 queueToken body/Authorization을 전달하고 응답을 파싱', async () => {
    let authHeader = '';
    let requestBody: unknown = null;

    server.use(
      http.post('http://localhost:8080/api/v1/queue/events/1/leave', async ({ request }) => {
        authHeader = request.headers.get('authorization') ?? '';
        requestBody = await request.json();

        return HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            left: true,
          },
        });
      })
    );

    const response = await leaveQueue(1, 'queue-token-1', 'jwt-token');

    expect(authHeader).toBe('Bearer jwt-token');
    expect(requestBody).toEqual({ queueToken: 'queue-token-1' });
    expect(response).toEqual({ left: true });
  });
});
