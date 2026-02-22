import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SeatResponse } from '../api/contracts';
import { getQueueToken } from '../auth/queueStorage';
import { getAuthToken } from '../auth/storage';
import { BookingPanel } from '../components/BookingPanel';
import { EventSummary } from '../components/EventSummary';
import { InlineAlert } from '../components/InlineAlert';
import { SeatGrid } from '../components/SeatGrid';
import { TopNavBar } from '../components/TopNavBar';
import { useSeatBooking } from './hooks/useSeatBooking';
import { useSeatNavigationGuard } from './hooks/useSeatNavigationGuard';
import { useSeatSelectionData } from './hooks/useSeatSelectionData';
import { parseSeatEventId } from './seatSelection.utils';

export function SeatSelectionPage() {
  const navigate = useNavigate();
  const { eventId: eventIdParam } = useParams();
  const eventId = parseSeatEventId(eventIdParam);
  const authToken = getAuthToken() ?? '';
  const currentPath = `/events/${eventId}/seats`;
  const queueToken = useMemo(() => getQueueToken(eventId) ?? '', [eventId]);

  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);

  const { allowInternalNavigationRef } = useSeatNavigationGuard({
    eventId,
    authToken,
  });

  const { event, seats, isLoading, pageError } = useSeatSelectionData({
    eventId,
    authToken,
    queueToken,
    currentPath,
    navigate,
    allowInternalNavigationRef,
  });

  const selectedSeats = useMemo(
    () => seats.filter((seat) => selectedSeatIds.includes(seat.id)),
    [seats, selectedSeatIds]
  );

  const { bookingPending, bookingFeedback, handleBookSeats, resetBookingFeedback } = useSeatBooking({
    eventId,
    authToken,
    queueToken,
    currentPath,
    navigate,
    selectedSeats,
    allowInternalNavigationRef,
    onSuccess: () => {
      setSelectedSeatIds([]);
    },
  });

  useEffect(() => {
    setSelectedSeatIds([]);
    resetBookingFeedback();
  }, [eventId, queueToken, resetBookingFeedback]);

  function handleToggleSeat(seat: SeatResponse) {
    if (seat.status !== 'AVAILABLE') {
      return;
    }

    setSelectedSeatIds((current) =>
      current.includes(seat.id) ? current.filter((id) => id !== seat.id) : [...current, seat.id]
    );
  }

  if (isLoading) {
    return (
      <main className="page-shell">
        <TopNavBar />
        <section className="card detail-heading fade-in">
          <p className="eyebrow">예매</p>
          <div className="detail-heading__top">
            <h1>좌석 선택</h1>
          </div>
        </section>
        <div className="card skeleton" />
        <div className="card skeleton" />
      </main>
    );
  }

  if (!event) {
    return (
      <main className="page-shell">
        <TopNavBar />
        <section className="card detail-heading fade-in">
          <p className="eyebrow">예매</p>
          <div className="detail-heading__top">
            <h1>좌석 선택</h1>
          </div>
        </section>
        {pageError ? (
          <InlineAlert tone="error" message={pageError} />
        ) : (
          <InlineAlert tone="error" message="좌석 정보를 불러오지 못했습니다." />
        )}
      </main>
    );
  }

  return (
    <main className="page-shell">
      <TopNavBar />
      <section className="card detail-heading fade-in">
        <p className="eyebrow">예매</p>
        <div className="detail-heading__top">
          <h1>좌석 선택</h1>
        </div>
      </section>
      {pageError ? <InlineAlert tone="error" message={pageError} /> : null}
      {bookingFeedback ? <InlineAlert tone={bookingFeedback.tone} message={bookingFeedback.message} /> : null}

      <EventSummary event={event} />

      <section className="detail-layout">
        <div className="detail-layout__left">
          <SeatGrid seats={seats} selectedSeatIds={selectedSeatIds} onToggleSeat={handleToggleSeat} />
        </div>
        <div className="detail-layout__right">
          <BookingPanel selectedSeats={selectedSeats} bookingPending={bookingPending} onSubmit={handleBookSeats} />
        </div>
      </section>
    </main>
  );
}
