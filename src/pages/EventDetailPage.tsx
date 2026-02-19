import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiMode, EventResponse, SeatResponse } from '../api/contracts';
import { fetchEventDetail, fetchEventSeats, submitBooking } from '../api/openTicketApi';
import { getAuthToken } from '../auth/storage';
import { BookingPanel } from '../components/BookingPanel';
import { EventSummary } from '../components/EventSummary';
import { InlineAlert } from '../components/InlineAlert';
import { SeatGrid } from '../components/SeatGrid';
import { TopNavBar } from '../components/TopNavBar';
import { mockEvent, mockSeats } from '../mocks/mockData';

function parseEventId(rawId: string | undefined): number {
  const parsed = Number(rawId);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function EventDetailPage() {
  const { eventId: eventIdParam } = useParams();
  const eventId = parseEventId(eventIdParam);

  const [event, setEvent] = useState<EventResponse | null>(null);
  const [seats, setSeats] = useState<SeatResponse[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const [authToken] = useState(() => getAuthToken() ?? '');
  const [queueToken] = useState(() => localStorage.getItem('open-ticket:queue-token') ?? '');
  const [mode, setMode] = useState<ApiMode>('LIVE');
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string>('');
  const [bookingPending, setBookingPending] = useState(false);
  const [bookingFeedback, setBookingFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDetail() {
      setIsLoading(true);
      setPageError('');
      setSelectedSeatIds([]);
      setBookingFeedback(null);

      try {
        const [eventResponse, seatsResponse] = await Promise.all([
          fetchEventDetail(eventId, authToken || undefined),
          fetchEventSeats(eventId, authToken || undefined, queueToken || undefined),
        ]);

        if (!isMounted) {
          return;
        }

        setMode('LIVE');
        setEvent(eventResponse);
        setSeats(seatsResponse);
      } catch {
        if (!isMounted) {
          return;
        }

        setMode('MOCK');
        setEvent({ ...mockEvent, id: eventId });
        setSeats(mockSeats.map((seat) => ({ ...seat, event: { ...mockEvent, id: eventId } })));
        setPageError('실서버 API에 연결할 수 없어 목 데이터를 표시합니다.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      isMounted = false;
    };
  }, [eventId, authToken, queueToken]);

  const selectedSeats = useMemo(
    () => seats.filter((seat) => selectedSeatIds.includes(seat.id)),
    [seats, selectedSeatIds]
  );

  function handleToggleSeat(seat: SeatResponse) {
    if (seat.status !== 'AVAILABLE') {
      return;
    }

    setSelectedSeatIds((current) =>
      current.includes(seat.id) ? current.filter((id) => id !== seat.id) : [...current, seat.id]
    );
  }

  async function handleBookSeats() {
    if (selectedSeats.length === 0) {
      return;
    }

    setBookingPending(true);
    setBookingFeedback(null);

    if (mode === 'MOCK') {
      window.setTimeout(() => {
        setBookingPending(false);
        setBookingFeedback({
          tone: 'success',
          message: '목 예매가 완료되었습니다. 실제 예매는 인증/대기열 토큰 연동 후 이용해 주세요.',
        });
      }, 250);
      return;
    }

    try {
      await submitBooking(
        eventId,
        { seatIds: selectedSeats.map((seat) => seat.id) },
        authToken || undefined,
        queueToken || undefined
      );
      setBookingFeedback({ tone: 'success', message: '예매가 완료되었습니다.' });
      setSelectedSeatIds([]);
    } catch (error) {
      const message = error instanceof Error ? error.message : '예매에 실패했습니다.';
      setBookingFeedback({ tone: 'error', message });
    } finally {
      setBookingPending(false);
    }
  }

  if (isLoading) {
    return (
      <main className="page-shell">
        <TopNavBar />
        <section className="card detail-heading fade-in">
          <p className="eyebrow">이벤트</p>
          <div className="detail-heading__top">
            <h1>이벤트 상세</h1>
            <span className={`mode-pill ${mode === 'MOCK' ? 'mode-pill--mock' : 'mode-pill--live'}`}>
              {mode === 'MOCK' ? '목 데이터 모드' : '실서버 API'}
            </span>
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
          <p className="eyebrow">이벤트</p>
          <div className="detail-heading__top">
            <h1>이벤트 상세</h1>
            <span className={`mode-pill ${mode === 'MOCK' ? 'mode-pill--mock' : 'mode-pill--live'}`}>
              {mode === 'MOCK' ? '목 데이터 모드' : '실서버 API'}
            </span>
          </div>
        </section>
        <InlineAlert tone="error" message="이벤트 상세 정보를 불러오지 못했습니다." />
      </main>
    );
  }

  return (
    <main className="page-shell">
      <TopNavBar />
      <section className="card detail-heading fade-in">
        <p className="eyebrow">이벤트</p>
        <div className="detail-heading__top">
          <h1>이벤트 상세</h1>
          <span className={`mode-pill ${mode === 'MOCK' ? 'mode-pill--mock' : 'mode-pill--live'}`}>
            {mode === 'MOCK' ? '목 데이터 모드' : '실서버 API'}
          </span>
        </div>
      </section>
      {pageError ? <InlineAlert tone="info" message={pageError} /> : null}
      {bookingFeedback ? <InlineAlert tone={bookingFeedback.tone} message={bookingFeedback.message} /> : null}

      <EventSummary event={event} />

      <section className="detail-layout">
        <div className="detail-layout__left">
          <SeatGrid seats={seats} selectedSeatIds={selectedSeatIds} onToggleSeat={handleToggleSeat} />
        </div>
        <div className="detail-layout__right">
          <BookingPanel
            selectedSeats={selectedSeats}
            bookingPending={bookingPending}
            onSubmit={handleBookSeats}
          />
        </div>
      </section>
    </main>
  );
}
