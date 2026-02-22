import { formatMonthTitle, formatSelectedDate, isDateInRange, isSameDay } from '../eventDetail.utils';

type EventDateRange = {
  start: Date;
  end: Date;
};

type EventCalendarProps = {
  viewMonth: Date;
  calendarDays: Date[];
  eventDateRange: EventDateRange;
  isSingleDayEvent: boolean;
  selectedDate: Date | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (day: Date) => void;
  bookingStartPending: boolean;
  onStartBooking: () => void;
};

export function EventCalendar(input: EventCalendarProps) {
  const {
    viewMonth,
    calendarDays,
    eventDateRange,
    isSingleDayEvent,
    selectedDate,
    onPrevMonth,
    onNextMonth,
    onSelectDate,
    bookingStartPending,
    onStartBooking,
  } = input;

  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <aside className="card event-booking-cta">
      <section className="event-calendar" aria-label="관람일 캘린더">
        <div className="event-calendar__header">
          <h3>관람일</h3>
        </div>

        <div className="event-calendar__month">
          <button type="button" className="event-calendar__nav" aria-label="이전 달" onClick={onPrevMonth}>
            ‹
          </button>
          <strong>{formatMonthTitle(viewMonth)}</strong>
          <button type="button" className="event-calendar__nav" aria-label="다음 달" onClick={onNextMonth}>
            ›
          </button>
        </div>

        <div className="event-calendar__weekdays">
          {weekdays.map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>

        <div className="event-calendar__grid">
          {calendarDays.map((day) => {
            const inCurrentMonth = day.getMonth() === viewMonth.getMonth();
            const inRange = isDateInRange(day, eventDateRange.start, eventDateRange.end);
            const selected = selectedDate ? isSameDay(day, selectedDate) : false;

            return (
              <button
                key={`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`}
                type="button"
                className={[
                  'event-calendar__day',
                  inCurrentMonth ? '' : 'event-calendar__day--outside',
                  inRange ? 'event-calendar__day--in-range' : 'event-calendar__day--disabled',
                  selected ? 'event-calendar__day--selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSelectDate(day)}
                disabled={!inRange}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </section>

      {!isSingleDayEvent && selectedDate ? (
        <p className="event-calendar__selected-date">선택일: {formatSelectedDate(selectedDate)}</p>
      ) : null}

      <button
        type="button"
        className="button-primary event-detail-action__button"
        onClick={onStartBooking}
        disabled={bookingStartPending}
      >
        {bookingStartPending ? '대기열 확인 중...' : '예매하기'}
      </button>
    </aside>
  );
}
