import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { InlineAlert } from '../components/InlineAlert';
import { TopNavBar } from '../components/TopNavBar';
import { EventCalendar } from './components/EventCalendar';
import { DetailTab, EventDetailTabs } from './components/EventDetailTabs';
import { useEventCalendar } from './hooks/useEventCalendar';
import { useEventDetailData } from './hooks/useEventDetailData';
import { useStartBooking } from './hooks/useStartBooking';
import { formatDateRange, parseEventDetailId } from './eventDetail.utils';

const SAMPLE_POSTER_IMAGE = '/sample-poster.svg';

export function EventDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { eventId: eventIdParam } = useParams();
  const eventId = parseEventDetailId(eventIdParam);
  const [activeTab, setActiveTab] = useState<DetailTab>('PERFORMANCE');

  const { event, mode, isLoading, loadError, entryNotice } = useEventDetailData({
    eventId,
    pathname: location.pathname,
    state: location.state,
    navigate,
  });

  const { eventDateRange, isSingleDayEvent, viewMonth, calendarDays, selectedDate, goToPreviousMonth, goToNextMonth, selectDate } =
    useEventCalendar({
      event,
    });

  const { bookingStartPending, handleStartBooking } = useStartBooking({
    eventId,
    pathname: location.pathname,
    navigate,
  });

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
      </main>
    );
  }

  if (!event || !eventDateRange || !viewMonth) {
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
        <InlineAlert tone="error" message={loadError || '이벤트 상세 정보를 불러오지 못했습니다.'} />
      </main>
    );
  }

  return (
    <main className="page-shell">
      <TopNavBar />
      <section className="card detail-heading fade-in">
        <p className="eyebrow">이벤트</p>
        <div className="detail-heading__top">
          <h1>{event.title}</h1>
          <span className={`mode-pill ${mode === 'MOCK' ? 'mode-pill--mock' : 'mode-pill--live'}`}>
            {mode === 'MOCK' ? '목 데이터 모드' : '실서버 API'}
          </span>
        </div>
      </section>

      {entryNotice ? <InlineAlert tone="info" message={entryNotice} /> : null}

      <section className="event-detail-layout fade-in">
        <div className="card event-detail-main">
          <img
            className="event-poster event-detail-main__poster"
            src={event.posterImageUrl || SAMPLE_POSTER_IMAGE}
            alt={`${event.title} 포스터`}
          />
          <p className="event-detail-action__meta">{formatDateRange(event.startAt, event.endAt)}</p>
          <p className="event-detail-action__meta">{event.venue}</p>
          <p className="event-detail-action__description">좌석 선택과 결제는 예매 페이지에서 진행됩니다.</p>
          <EventDetailTabs activeTab={activeTab} onTabChange={setActiveTab} venue={event.venue} />
        </div>

        <EventCalendar
          viewMonth={viewMonth}
          calendarDays={calendarDays}
          eventDateRange={eventDateRange}
          isSingleDayEvent={isSingleDayEvent}
          selectedDate={selectedDate}
          onPrevMonth={goToPreviousMonth}
          onNextMonth={goToNextMonth}
          onSelectDate={selectDate}
          bookingStartPending={bookingStartPending}
          onStartBooking={handleStartBooking}
        />
      </section>
    </main>
  );
}
