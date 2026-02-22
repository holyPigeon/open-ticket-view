import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Category, EventResponse } from '../api/contracts';
import { fetchEvents } from '../api/openTicketApi';
import { InlineAlert } from '../components/InlineAlert';
import { TopNavBar } from '../components/TopNavBar';

type LoadState = 'idle' | 'loading' | 'success' | 'error';

const SAMPLE_POSTER_IMAGE = '/sample-poster.svg';

function formatDateRange(startAt: string, endAt: string): string {
  const formatDate = (dateValue: string) => {
    const date = new Date(dateValue);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  return `${formatDate(startAt)} ~ ${formatDate(endAt)}`;
}

export function HomePage() {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [titleQueryInput, setTitleQueryInput] = useState('');
  const [titleQuery, setTitleQuery] = useState('');
  const [category, setCategory] = useState<'ALL' | Category>('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadEvents() {
      setLoadState('loading');
      setErrorMessage('');

      try {
        const page = await fetchEvents({
          page: currentPage,
          size: 20,
          sort: 'id,desc',
          title: titleQuery || undefined,
          category: category === 'ALL' ? undefined : category,
        });

        if (!isMounted) {
          return;
        }

        setEvents(page.content);
        setTotalPages(page.totalPages);
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
  }, [titleQuery, category, currentPage]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCurrentPage(0);
    setTitleQuery(titleQueryInput.trim());
  }

  return (
    <main className="page-shell">
      <TopNavBar />

      <section className="card home-hero fade-in">
        <p className="eyebrow">이벤트</p>
        <h1>이벤트 목록</h1>
        <p className="home-hero__desc">원하는 이벤트를 찾아 바로 예매를 진행하세요.</p>

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
              onChange={(e) => {
                setCurrentPage(0);
                setCategory(e.target.value as 'ALL' | Category);
              }}
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
        <>
          <section className="home-grid" aria-label="이벤트 목록">
            {events.map((eventItem) => (
              <Link key={eventItem.id} to={`/events/${eventItem.id}`} className="home-card-link">
                <article className="card home-card fade-in">
                  <div className="home-card__poster-frame">
                    <img
                      className="home-card__poster"
                      src={eventItem.posterImageUrl || SAMPLE_POSTER_IMAGE}
                      alt={`${eventItem.title} 포스터`}
                      width={300}
                      height={400}
                      loading="lazy"
                      onError={(errorEvent) => {
                        const target = errorEvent.currentTarget;
                        if (target.src.endsWith(SAMPLE_POSTER_IMAGE)) {
                          return;
                        }
                        target.src = SAMPLE_POSTER_IMAGE;
                      }}
                    />
                  </div>
                  <h2>{eventItem.title}</h2>
                  <p className="home-card__date">{formatDateRange(eventItem.startAt, eventItem.endAt)}</p>
                  <p className="home-card__venue">{eventItem.venue}</p>
                </article>
              </Link>
            ))}
          </section>

          {totalPages > 1 ? (
            <nav className="home-pagination" aria-label="이벤트 목록 페이지네이션">
              <button
                type="button"
                className="home-pagination__button"
                onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
                disabled={currentPage === 0}
              >
                이전
              </button>

              <div className="home-pagination__pages">
                {Array.from({ length: totalPages }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`home-pagination__button ${currentPage === index ? 'home-pagination__button--active' : ''}`}
                    aria-current={currentPage === index ? 'page' : undefined}
                    onClick={() => setCurrentPage(index)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="home-pagination__button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages - 1, page + 1))}
                disabled={currentPage === totalPages - 1}
              >
                다음
              </button>
            </nav>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
