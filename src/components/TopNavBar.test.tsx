import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AUTH_TOKEN_KEY } from '../auth/storage';
import { TopNavBar } from './TopNavBar';

function renderNav(initialPath = '/') {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="*" element={<TopNavBar />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('TopNavBar', () => {
  it('비로그인 상태에서 로그인 링크를 노출', () => {
    renderNav();

    expect(screen.getByRole('link', { name: '로그인' })).toBeInTheDocument();
  });

  it('로그인 상태에서 로그아웃 버튼을 노출', () => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'jwt');
    renderNav();

    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument();
  });

  it('로그아웃 클릭 시 토큰 제거', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'jwt');
    renderNav();

    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));

    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
  });

  it('브랜드 링크가 홈 경로를 가리킴', () => {
    renderNav();

    const homeLink = screen.getByRole('link', { name: '홈으로 이동' });
    expect(homeLink).toHaveAttribute('href', '/');
  });
});
