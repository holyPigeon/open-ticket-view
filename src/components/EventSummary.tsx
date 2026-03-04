import { EventResponse } from '../api/contracts';
import { formatDotDateTimeRange } from '../utils/dateFormat';

type EventSummaryProps = {
  event: EventResponse;
};

const categoryLabel: Record<string, string> = {
  CONCERT: '콘서트',
  SPORTS: '스포츠',
};

export function EventSummary({ event }: EventSummaryProps) {
  return (
    <section className="card event-summary fade-in" aria-label="이벤트 상세 정보">
      <div className="event-summary__top">
        <h2>{event.title}</h2>
        <span className="category-pill">{categoryLabel[event.category] ?? event.category}</span>
      </div>
      <p className="event-summary__meta event-summary__meta--datetime">{formatDotDateTimeRange(event.startAt, event.endAt)}</p>
      <p className="event-summary__meta">{event.venue}</p>
    </section>
  );
}
