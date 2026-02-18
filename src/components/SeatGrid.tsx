import clsx from 'clsx';
import { SeatResponse } from '../api/contracts';
import { groupSeatsByRow, isSeatSelectable } from './seatUtils';

type SeatGridProps = {
  seats: SeatResponse[];
  selectedSeatIds: number[];
  onToggleSeat: (seat: SeatResponse) => void;
};

export function SeatGrid({ seats, selectedSeatIds, onToggleSeat }: SeatGridProps) {
  const groupedSeats = groupSeatsByRow(seats);
  const orderedRows = Object.keys(groupedSeats).sort();

  return (
    <section className="card fade-in" aria-label="Seat selection">
      <div className="section-head">
        <h3>Select Seats</h3>
        <span className="section-subtext">Available seats are clickable</span>
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
                    aria-label={`${seat.seatNumber} ${seat.status}`}
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
