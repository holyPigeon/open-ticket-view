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
    <section className="card booking-panel fade-in" aria-label="Booking panel">
      <div className="section-head">
        <h3>Booking Summary</h3>
        <span className="section-subtext">{selectedSeats.length} seat(s) selected</span>
      </div>

      <ul className="selected-list">
        {selectedSeats.length === 0 ? (
          <li className="selected-list__empty">Pick seats to create a booking.</li>
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
        <span>Total</span>
        <strong>₩{totalPrice.toLocaleString('en-US')}</strong>
      </div>

      <button
        className="button-primary"
        type="button"
        onClick={onSubmit}
        disabled={selectedSeats.length === 0 || bookingPending}
      >
        {bookingPending ? 'Submitting...' : 'Book selected seats'}
      </button>
    </section>
  );
}
