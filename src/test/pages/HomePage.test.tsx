import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { server } from '../setup';
import { HomePage } from '../../pages/HomePage';

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
    pageSize: 20,
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
  size: 20,
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

    const title = await screen.findByText('홈 이벤트');
    const card = title.closest('article');

    expect(card).not.toBeNull();
    expect(title).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '홈 이벤트 포스터' })).toHaveAttribute('src', '/sample-poster.svg');
    expect((card as HTMLElement).querySelector('.home-card__poster-frame')).not.toBeNull();
    expect(within(card as HTMLElement).queryByText('콘서트')).not.toBeInTheDocument();
    expect(within(card as HTMLElement).getByText('2026.05.01 ~ 2026.05.01')).toBeInTheDocument();
    expect(within(card as HTMLElement).queryByRole('button', { name: '예매' })).not.toBeInTheDocument();
    expect((card as HTMLElement).textContent).not.toContain('오전');
    expect((card as HTMLElement).textContent).not.toContain('오후');
  });

  it('포스터 이미지가 있으면 해당 이미지를 렌더링', async () => {
    server.use(
      http.get('http://localhost:8080/api/v1/events', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            ...pageResponse,
            content: [{ ...pageResponse.content[0], posterImageUrl: 'https://cdn.example.com/poster.jpg' }],
          },
        })
      )
    );

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('img', { name: '홈 이벤트 포스터' })).toHaveAttribute(
      'src',
      'https://cdn.example.com/poster.jpg'
    );
  });

  it('imageUrl만 있어도 포스터 이미지를 렌더링', async () => {
    server.use(
      http.get('http://localhost:8080/api/v1/events', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            ...pageResponse,
            content: [{ ...pageResponse.content[0], imageUrl: '/images/events/event-1.jpg' }],
          },
        })
      )
    );

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('img', { name: '홈 이벤트 포스터' })).toHaveAttribute(
      'src',
      'http://localhost:8080/images/events/event-1.jpg'
    );
  });

  it('포스터 이미지 로딩 실패 시 샘플 이미지로 대체', async () => {
    server.use(
      http.get('http://localhost:8080/api/v1/events', () =>
        HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            ...pageResponse,
            content: [{ ...pageResponse.content[0], posterImageUrl: 'https://cdn.example.com/broken-image.jpg' }],
          },
        })
      )
    );

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const posterImage = await screen.findByRole('img', { name: '홈 이벤트 포스터' });
    expect(posterImage).toHaveAttribute('src', 'https://cdn.example.com/broken-image.jpg');

    fireEvent.error(posterImage);

    expect(posterImage).toHaveAttribute('src', '/sample-poster.svg');
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

  it('카드 링크 클릭 시 이벤트 상세 경로로 이동', async () => {
    server.use(
      http.get('http://localhost:8080/api/v1/events', () =>
        HttpResponse.json({ code: 200, status: 'OK', message: 'OK', data: pageResponse })
      )
    );

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/events/:eventId" element={<div>이벤트 상세 페이지 이동</div>} />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.click(await screen.findByRole('link', { name: /홈 이벤트/ }));
    expect(await screen.findByText('이벤트 상세 페이지 이동')).toBeInTheDocument();
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

  it('페이지네이션 버튼으로 페이지를 이동해 다음 목록을 조회', async () => {
    server.use(
      http.get('http://localhost:8080/api/v1/events', ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page') ?? 0);
        const size = Number(new URL(request.url).searchParams.get('size') ?? 0);

        expect(size).toBe(20);

        if (page === 1) {
          return HttpResponse.json({
            code: 200,
            status: 'OK',
            message: 'OK',
            data: {
              ...pageResponse,
              content: [{ ...pageResponse.content[0], id: 2, title: '두 번째 페이지 이벤트' }],
              totalPages: 2,
              totalElements: 2,
              first: false,
              last: true,
              number: 1,
              numberOfElements: 1,
            },
          });
        }

        return HttpResponse.json({
          code: 200,
          status: 'OK',
          message: 'OK',
          data: {
            ...pageResponse,
            content: [{ ...pageResponse.content[0], id: 1, title: '첫 페이지 이벤트' }],
            totalPages: 2,
            totalElements: 2,
            first: true,
            last: false,
            number: 0,
            numberOfElements: 1,
          },
        });
      })
    );

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(await screen.findByText('첫 페이지 이벤트')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '2' }));

    expect(await screen.findByText('두 번째 페이지 이벤트')).toBeInTheDocument();
  });
});
