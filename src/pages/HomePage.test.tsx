import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { server } from '../test/setup';
import { HomePage } from './HomePage';

const pageResponse = {
  content: [
    {
      id: 1,
      title: '홈 이벤트',
      category: 'CONCERT',
      startAt: '2026-05-01T19:00:00',
      endAt: '2026-05-01T22:00:00',
      venue: '잠실 주경기장',
    },
  ],
  pageable: {
    pageNumber: 0,
    pageSize: 10,
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
  size: 10,
  numberOfElements: 1,
  empty: false,
  sort: { sorted: true, unsorted: false, empty: false },
};

describe('HomePage', () => {
  it('목록 API 성공 시 이벤트 카드를 렌더링', async () => {
    server.use(
      http.get('http://localhost:8080/api/v1/events', () =>
        HttpResponse.json({ code: 200, status: 'OK', message: 'OK', data: pageResponse })
      )
    );

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(await screen.findByText('홈 이벤트')).toBeInTheDocument();
  });

  it('목록 API 실패 시 에러 메시지 표시', async () => {
    server.use(
      http.get('http://localhost:8080/api/v1/events', () =>
        HttpResponse.json(
          { code: 500, status: 'INTERNAL_SERVER_ERROR', message: '조회 실패', data: null },
          { status: 500 }
        )
      )
    );

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(await screen.findByText('조회 실패')).toBeInTheDocument();
  });

  it('상세 보기 클릭 시 이벤트 상세 경로로 이동', async () => {
    server.use(
      http.get('http://localhost:8080/api/v1/events', () =>
        HttpResponse.json({ code: 200, status: 'OK', message: 'OK', data: pageResponse })
      )
    );

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/events/:eventId" element={<div>상세 페이지 이동</div>} />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.click(await screen.findByRole('button', { name: '상세 보기' }));
    expect(await screen.findByText('상세 페이지 이동')).toBeInTheDocument();
  });

  it('조회 결과가 없으면 빈 상태 메시지 표시', async () => {
    server.use(
      http.get('http://localhost:8080/api/v1/events', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: { ...pageResponse, content: [], totalElements: 0, numberOfElements: 0, empty: true },
        })
      )
    );

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(await screen.findByText('조건에 맞는 이벤트가 없습니다.')).toBeInTheDocument();
  });
});
