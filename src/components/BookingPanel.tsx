import { SeatResponse } from '../api/contracts';
import { calculateTotalPrice } from './seatUtils';

type BookingPanelProps = {
  selectedSeats: SeatResponse[];
  bookingPending: boolean;
  onSubmit: () => void;
};

export function BookingPanel({ selectedSeats, bookingPending, onSubmit }: BookingPanelProps) {
  const totalPrice = calculateTotalPrice(selectedSeats);

  return (
    <section className="card booking-panel fade-in" aria-label="예매 패널">
      <div className="section-head">
        <h3>예매 요약</h3>
        <span className="section-subtext">{selectedSeats.length}개 좌석 선택됨</span>
      </div>

      <ul className="selected-list">
        {selectedSeats.length === 0 ? (
          <li className="selected-list__empty">예매할 좌석을 선택해 주세요.</li>
        ) : (
          selectedSeats.map((seat) => (
            <li key={seat.id} className="selected-list__item">
              <span>{seat.seatNumber}</span>
              <span>₩{seat.price.toLocaleString('en-US')}</span>
            </li>
          ))
        )}
      </ul>

      <div className="booking-total">
        <span>총액</span>
        <strong>₩{totalPrice.toLocaleString('en-US')}</strong>
      </div>

      <button
        className="button-primary"
        type="button"
        onClick={onSubmit}
        disabled={selectedSeats.length === 0 || bookingPending}
      >
        {bookingPending ? '예매 처리 중...' : '선택 좌석 예매하기'}
      </button>
    </section>
  );
}
