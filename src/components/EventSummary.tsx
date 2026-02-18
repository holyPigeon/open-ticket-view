import { EventResponse } from '../api/contracts';

type EventSummaryProps = {
  event: EventResponse;
};

const categoryLabel: Record<string, string> = {
  CONCERT: '콘서트',
  SPORTS: '스포츠',
};

function formatDateRange(startAt: string, endAt: string): string {
  const formatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  const start = new Date(startAt).toLocaleString('en-US', formatOptions);
  const end = new Date(endAt).toLocaleString('en-US', formatOptions);

  return `${start} - ${end}`;
}

export function EventSummary({ event }: EventSummaryProps) {
  return (
    <section className="card event-summary fade-in" aria-label="이벤트 상세 정보">
      <div className="event-summary__top">
        <h2>{event.title}</h2>
        <span className="category-pill">{categoryLabel[event.category] ?? event.category}</span>
      </div>
      <p className="event-summary__meta">{formatDateRange(event.startAt, event.endAt)}</p>
      <p className="event-summary__meta">{event.venue}</p>
    </section>
  );
}
