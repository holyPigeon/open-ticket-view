import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Category, EventResponse } from '../api/contracts';
import { fetchEvents } from '../api/openTicketApi';
import { InlineAlert } from '../components/InlineAlert';
import { TopNavBar } from '../components/TopNavBar';

type LoadState = 'idle' | 'loading' | 'success' | 'error';

const categoryLabel: Record<Category, string> = {
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

  const start = new Date(startAt).toLocaleString('ko-KR', formatOptions);
  const end = new Date(endAt).toLocaleString('ko-KR', formatOptions);

  return `${start} - ${end}`;
}

export function HomePage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [titleQueryInput, setTitleQueryInput] = useState('');
  const [titleQuery, setTitleQuery] = useState('');
  const [category, setCategory] = useState<'ALL' | Category>('ALL');

  useEffect(() => {
    let isMounted = true;

    async function loadEvents() {
      setLoadState('loading');
      setErrorMessage('');

      try {
        const page = await fetchEvents({
          page: 0,
          size: 12,
          sort: 'id,desc',
          title: titleQuery || undefined,
          category: category === 'ALL' ? undefined : category,
        });

        if (!isMounted) {
          return;
        }

        setEvents(page.content);
        setLoadState('success');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setLoadState('error');
        setErrorMessage(error instanceof Error ? error.message : '이벤트 목록을 불러오지 못했습니다.');
      }
    }

    void loadEvents();

    return () => {
      isMounted = false;
    };
  }, [titleQuery, category]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTitleQuery(titleQueryInput.trim());
  }

  return (
    <main className="page-shell">
      <TopNavBar />

      <section className="card home-hero fade-in">
        <p className="eyebrow">이벤트</p>
        <h1>이벤트 목록</h1>
        <p className="home-hero__desc">원하는 이벤트를 찾아 상세 페이지에서 좌석과 예매 정보를 확인하세요.</p>

        <form className="home-filter" onSubmit={handleSearch}>
          <label className="field home-filter__field">
            <span>이벤트명</span>
            <input
              type="text"
              value={titleQueryInput}
              onChange={(e) => setTitleQueryInput(e.target.value)}
              placeholder="이벤트명을 입력하세요"
            />
          </label>

          <label className="field home-filter__field">
            <span>카테고리</span>
            <select
              className="home-select"
              value={category}
              onChange={(e) => setCategory(e.target.value as 'ALL' | Category)}
            >
              <option value="ALL">전체</option>
              <option value="CONCERT">콘서트</option>
              <option value="SPORTS">스포츠</option>
            </select>
          </label>

          <button type="submit" className="button-primary home-filter__submit">
            검색
          </button>
        </form>
      </section>

      {loadState === 'error' ? <InlineAlert tone="error" message={errorMessage} /> : null}

      {loadState === 'loading' ? (
        <section className="home-grid" aria-label="이벤트 목록 로딩">
          <div className="card skeleton" />
          <div className="card skeleton" />
          <div className="card skeleton" />
        </section>
      ) : null}

      {loadState === 'success' && events.length === 0 ? (
        <InlineAlert tone="info" message="조건에 맞는 이벤트가 없습니다." />
      ) : null}

      {loadState === 'success' && events.length > 0 ? (
        <section className="home-grid" aria-label="이벤트 목록">
          {events.map((eventItem) => (
            <article key={eventItem.id} className="card home-card fade-in">
              <div className="home-card__top">
                <h2>{eventItem.title}</h2>
                <span className="category-pill">{categoryLabel[eventItem.category]}</span>
              </div>
              <p>{formatDateRange(eventItem.startAt, eventItem.endAt)}</p>
              <p>{eventItem.venue}</p>
              <button
                type="button"
                className="button-primary home-card__button"
                onClick={() => navigate(`/events/${eventItem.id}`)}
              >
                상세 보기
              </button>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  );
}
