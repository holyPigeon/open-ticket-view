import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockSeats } from '../../mocks/mockData';
import { SeatGrid } from '../../components/SeatGrid';

describe('SeatGrid', () => {
  it('좌석이 비어 있으면 빈 상태 문구를 표시하고 좌석 버튼은 렌더링하지 않는다', () => {
    render(<SeatGrid seats={[]} selectedSeatIds={[]} onToggleSeat={vi.fn()} />);

    expect(screen.getByText('현재 선택 가능한 좌석이 없습니다.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /예약 가능|예약 중|판매 완료/ })).not.toBeInTheDocument();
  });

  it('좌석이 있으면 좌석 버튼을 렌더링한다', () => {
    render(<SeatGrid seats={[mockSeats[1]]} selectedSeatIds={[]} onToggleSeat={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'A2 예약 가능' })).toBeInTheDocument();
  });
});
