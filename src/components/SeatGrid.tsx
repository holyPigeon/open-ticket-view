import clsx from 'clsx';
import { SeatResponse } from '../api/contracts';
import { groupSeatsByRow, isSeatSelectable } from './seatUtils';

type SeatGridProps = {
  seats: SeatResponse[];
  selectedSeatIds: number[];
  onToggleSeat: (seat: SeatResponse) => void;
};

function statusToKorean(status: string): string {
  if (status === 'AVAILABLE') return '예약 가능';
  if (status === 'BOOKED') return '예약 중';
  if (status === 'SOLD') return '판매 완료';
  return status;
}

export function SeatGrid({ seats, selectedSeatIds, onToggleSeat }: SeatGridProps) {
  const groupedSeats = groupSeatsByRow(seats);
  const orderedRows = Object.keys(groupedSeats).sort();

  return (
    <section className="card fade-in" aria-label="좌석 선택">
      <div className="section-head">
        <h3>좌석 선택</h3>
        <span className="section-subtext">예매 가능한 좌석만 선택할 수 있습니다</span>
      </div>
      <div className="seat-rows">
        {orderedRows.map((row) => (
          <div key={row} className="seat-row">
            <span className="row-label">{row}</span>
            <div className="seat-row__items">
              {groupedSeats[row].map((seat) => {
                const selectable = isSeatSelectable(seat.status);
                const selected = selectedSeatIds.includes(seat.id);
                return (
                  <button
                    key={seat.id}
                    type="button"
                    disabled={!selectable}
                    onClick={() => onToggleSeat(seat)}
                    className={clsx('seat-button', {
                      'seat-button--selected': selected,
                      'seat-button--blocked': !selectable,
                    })}
                    aria-label={`${seat.seatNumber} ${statusToKorean(seat.status)}`}
                  >
                    <span>{seat.seatNumber}</span>
                    <span className="seat-price">₩{seat.price.toLocaleString('en-US')}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
