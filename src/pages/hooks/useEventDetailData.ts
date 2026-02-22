import { useEffect, useState } from 'react';
import { NavigateFunction } from 'react-router-dom';
import { ApiMode, EventResponse } from '../../api/contracts';
import { fetchEventDetail } from '../../api/openTicketApi';
import { getAuthToken } from '../../auth/storage';
import { isSessionExpiredError, promptSessionExpired } from '../../auth/session';
import { showGlobalTopBanner } from '../../components/globalUiStore';
import { mockEvent } from '../../mocks/mockData';

export type EventDetailLocationState = {
  seatSessionExpired?: boolean;
  reason?: string;
};

type UseEventDetailDataInput = {
  eventId: number;
  pathname: string;
  state: unknown;
  navigate: NavigateFunction;
};

type UseEventDetailDataOutput = {
  event: EventResponse | null;
  mode: ApiMode;
  isLoading: boolean;
  loadError: string | null;
  entryNotice: string;
};

const DEFAULT_EXPIRED_NOTICE_MESSAGE =
  '좌석 선택 시간이 만료되었거나 대기열 토큰이 유효하지 않아 예매 상세 페이지로 돌아왔습니다. 다시 예매하기를 눌러 주세요.';

export function useEventDetailData(input: UseEventDetailDataInput): UseEventDetailDataOutput {
  const { eventId, pathname, state, navigate } = input;
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [mode, setMode] = useState<ApiMode>('LIVE');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [entryNotice, setEntryNotice] = useState('');

  useEffect(() => {
    const locationState = (state as EventDetailLocationState | null) ?? null;
    if (!locationState?.seatSessionExpired) {
      return;
    }

    setEntryNotice(locationState.reason || DEFAULT_EXPIRED_NOTICE_MESSAGE);
    navigate(pathname, { replace: true });
  }, [navigate, pathname, state]);

  useEffect(() => {
    let isMounted = true;

    async function loadDetail() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const eventResponse = await fetchEventDetail(eventId, getAuthToken() ?? undefined);

        if (!isMounted) {
          return;
        }

        setMode('LIVE');
        setEvent(eventResponse);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (isSessionExpiredError(error)) {
          promptSessionExpired({
            fromPath: pathname,
            requiresAuthRoute: false,
          });
          setLoadError('이벤트 상세 정보를 불러오지 못했습니다.');
          return;
        }

        setMode('MOCK');
        setEvent({ ...mockEvent, id: eventId });
        showGlobalTopBanner({
          tone: 'info',
          message: '실서버 API에 연결할 수 없어 목 데이터를 표시합니다.',
        });
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
  }, [eventId, pathname]);

  return {
    event,
    mode,
    isLoading,
    loadError,
    entryNotice,
  };
}
