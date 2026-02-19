import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { QueueStatusResponse } from '../api/contracts';
import { checkQueueStatus, enterQueue } from '../api/openTicketApi';
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

export function QueuePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { eventId: eventIdParam } = useParams();
  const eventId = parseEventId(eventIdParam);

  const [authToken] = useState(() => getAuthToken() ?? '');
  const [status, setStatus] = useState<QueueStatusResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const locationState = (location.state as QueueLocationState | null) ?? null;
  const initialToken = useMemo(
    () => locationState?.token || getQueueToken(eventId) || '',
    [eventId, locationState?.token]
  );

  useEffect(() => {
    let isMounted = true;
    let intervalId: number | null = null;

    function goToDetailWithToken(nextToken: string) {
      setQueueToken(eventId, nextToken);
      navigate(`/events/${eventId}`, { replace: true });
    }

    async function enterAndHandleQueue() {
      const entered = await enterQueue(eventId, authToken || undefined);
      setQueueToken(eventId, entered.token);

      if (entered.phase === 'ALLOWED') {
        goToDetailWithToken(entered.token);
        return null;
      }

      return entered.token;
    }

    async function reenterAfterInvalidToken(): Promise<string | null> {
      clearQueueToken(eventId);
      const reentered = await enterAndHandleQueue();
      if (!reentered || !isMounted) {
        return null;
      }

      const checked = await checkOnce(reentered);
      if (!checked || !isMounted) {
        return null;
      }

      setErrorMessage('');
      return checked;
    }

    async function checkOnce(token: string): Promise<string | null> {
      const checked = await checkQueueStatus(eventId, token, authToken || undefined);

      if (!isMounted) {
        return null;
      }

      setStatus(checked);
      setQueueToken(eventId, checked.token);

      if (checked.phase === 'ALLOWED') {
        goToDetailWithToken(checked.token);
        return null;
      }

      return checked.token;
    }

    async function startPolling() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        let token = initialToken;

        if (!token) {
          const enteredToken = await enterAndHandleQueue();
          if (!enteredToken || !isMounted) {
            return;
          }
          token = enteredToken;
        }

        let checkedToken: string | null = null;

        try {
          checkedToken = await checkOnce(token);
        } catch (error) {
          const message = error instanceof Error ? error.message : '대기열 상태를 확인하지 못했습니다.';
          if (!message.includes('유효하지 않은 대기열 토큰')) {
            throw error;
          }

          checkedToken = await reenterAfterInvalidToken();
        }

        if (!checkedToken || !isMounted) {
          return;
        }
        token = checkedToken;

        setIsLoading(false);

        intervalId = window.setInterval(async () => {
          try {
            const nextToken = await checkOnce(token);
            if (nextToken && nextToken !== token) {
              token = nextToken;
            }
          } catch (error) {
            if (!isMounted) {
              return;
            }

            const message = error instanceof Error ? error.message : '대기열 상태를 확인하지 못했습니다.';

            if (message.includes('유효하지 않은 대기열 토큰')) {
              try {
                const recovered = await reenterAfterInvalidToken();
                if (recovered) {
                  token = recovered;
                }
              } catch (retryError) {
                const retryMessage = retryError instanceof Error ? retryError.message : '대기열 재진입에 실패했습니다.';
                setErrorMessage(retryMessage);
              }
            } else {
              setErrorMessage(message);
            }
          }
        }, POLLING_INTERVAL_MS);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setIsLoading(false);
        setErrorMessage(error instanceof Error ? error.message : '대기열 정보를 불러오지 못했습니다.');
      }
    }

    void startPolling();

    return () => {
      isMounted = false;
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, [authToken, eventId, initialToken, navigate]);

  return (
    <main className="page-shell queue-shell">
      <TopNavBar />

      <section className="card queue-card fade-in" aria-label="대기열 정보">
        <p className="eyebrow">대기열</p>
        <h1>예매 대기 중입니다</h1>

        {isLoading ? <p className="queue-meta">대기열 정보를 확인하는 중...</p> : null}

        {!isLoading && status?.phase === 'WAITING' ? (
          <>
            <p className="queue-position">{status.position}번째 순서입니다.</p>
            <p className="queue-meta">2초마다 순서를 갱신합니다.</p>
          </>
        ) : null}

        {!isLoading && status?.phase === 'ALLOWED' ? (
          <p className="queue-meta">입장 허용됨 ({formatRemainingSeconds(status.remainingSeconds)})</p>
        ) : null}
      </section>

      {errorMessage ? <InlineAlert tone="info" message={errorMessage} /> : null}
    </main>
  );
}
