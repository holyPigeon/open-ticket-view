import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { QueueStatusResponse } from '../api/contracts';
import { checkQueueStatus } from '../api/openTicketApi';
import { isSessionExpiredError, promptSessionExpired } from '../auth/session';
import { clearQueueToken, getQueueToken, setQueueToken } from '../auth/queueStorage';
import { getAuthToken } from '../auth/storage';
import { InlineAlert } from '../components/InlineAlert';
import { TopNavBar } from '../components/TopNavBar';

type QueueLocationState = {
  token?: string;
};

const POLLING_INTERVAL_MS = 2000;

function parseEventId(rawId: string | undefined): number {
  const parsed = Number(rawId);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function formatRemainingSeconds(remainingSeconds: number): string {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  return `${minutes}분 ${seconds.toString().padStart(2, '0')}초`;
}

function formatUpdatedAt(date: Date): string {
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function QueuePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { eventId: eventIdParam } = useParams();
  const eventId = parseEventId(eventIdParam);

  const [authToken] = useState(() => getAuthToken() ?? '');
  const [status, setStatus] = useState<QueueStatusResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const locationState = (location.state as QueueLocationState | null) ?? null;
  const currentPath = `/events/${eventId}/seats/queue`;
  const initialToken = useMemo(
    () => locationState?.token || getQueueToken(eventId) || '',
    [eventId, locationState?.token]
  );

  useEffect(() => {
    let isMounted = true;
    let timeoutId: number | null = null;

    function goToSeatSelectionWithToken(nextToken: string) {
      setQueueToken(eventId, nextToken);
      navigate(`/events/${eventId}/seats`, { replace: true });
    }

    async function checkOnce(token: string): Promise<string | null> {
      const checked = await checkQueueStatus(eventId, token, authToken || undefined);

      if (!isMounted) {
        return null;
      }

      setStatus(checked);
      setQueueToken(eventId, checked.token);
      setLastUpdatedAt(new Date());

      if (checked.phase === 'ALLOWED') {
        goToSeatSelectionWithToken(checked.token);
        return null;
      }

      return checked.token;
    }

    async function startPolling() {
      if (!initialToken) {
        navigate(`/events/${eventId}`, { replace: true });
        return;
      }

      setIsLoading(true);
      setErrorMessage('');

      let token = initialToken;

      async function poll() {
        try {
          const nextToken = await checkOnce(token);

          if (!isMounted || !nextToken) {
            return;
          }

          token = nextToken;
          setIsLoading(false);
          timeoutId = window.setTimeout(() => {
            void poll();
          }, POLLING_INTERVAL_MS);
        } catch (error) {
          if (!isMounted) {
            return;
          }

          if (isSessionExpiredError(error)) {
            promptSessionExpired({
              fromPath: currentPath,
              requiresAuthRoute: true,
            });
            return;
          }

          const message = error instanceof Error ? error.message : '대기열 상태를 확인하지 못했습니다.';
          if (message.includes('유효하지 않은 대기열 토큰')) {
            clearQueueToken(eventId);
            navigate(`/events/${eventId}`, { replace: true });
            return;
          }

          setIsLoading(false);
          setErrorMessage(message);
        }
      }

      await poll();
    }

    void startPolling();

    return () => {
      isMounted = false;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [authToken, currentPath, eventId, initialToken, navigate]);

  return (
    <main className="page-shell queue-shell">
      <TopNavBar />

      <section className="card queue-card fade-in" aria-label="대기열 정보">
        <header className="queue-card__header">
          <p className="eyebrow">대기열</p>
          <h1>예매 대기 중입니다</h1>
        </header>

        <div className="queue-card__content">
          {isLoading || status?.phase === 'WAITING' ? (
            <div className="queue-loader-block">
              <div className="queue-loader" aria-hidden="true" />

              {isLoading ? <p className="queue-meta">대기열 정보를 확인하는 중...</p> : null}

              {!isLoading && status?.phase === 'WAITING' ? (
                <>
                  <p className="queue-position queue-position--animated">{status.position}번째 순서입니다.</p>
                  <p className="queue-meta">2초마다 순서를 갱신합니다.</p>
                </>
              ) : null}
            </div>
          ) : (
            <p className="queue-meta">
              {status?.phase === 'ALLOWED'
                ? `입장 허용됨 (${formatRemainingSeconds(status.remainingSeconds)})`
                : '대기열 정보를 다시 불러오는 중입니다.'}
            </p>
          )}
        </div>

        <footer className="queue-card__footer" aria-live="polite">
          {!isLoading && status?.phase === 'WAITING' && lastUpdatedAt ? (
            <p className="queue-meta">마지막 갱신: {formatUpdatedAt(lastUpdatedAt)}</p>
          ) : null}
        </footer>
      </section>

      {errorMessage ? <InlineAlert tone="info" message={errorMessage} /> : null}
    </main>
  );
}
