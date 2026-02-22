import { MutableRefObject, useEffect, useState } from 'react';
import { NavigateFunction } from 'react-router-dom';
import { EventResponse, SeatResponse } from '../../api/contracts';
import { checkQueueStatus, fetchEventDetail, fetchEventSeats } from '../../api/openTicketApi';
import { isSessionExpiredError, promptSessionExpired } from '../../auth/session';
import { clearQueueToken, setQueueToken } from '../../auth/queueStorage';
import { EXPIRED_NOTICE_MESSAGE } from '../seatSelection.constants';
import { isQueueTokenError } from '../seatSelection.utils';

type UseSeatSelectionDataInput = {
  eventId: number;
  authToken?: string;
  queueToken: string;
  currentPath: string;
  navigate: NavigateFunction;
  allowInternalNavigationRef: MutableRefObject<boolean>;
};

type UseSeatSelectionDataOutput = {
  event: EventResponse | null;
  seats: SeatResponse[];
  isLoading: boolean;
  pageError: string;
};

export function useSeatSelectionData(input: UseSeatSelectionDataInput): UseSeatSelectionDataOutput {
  const { eventId, authToken, queueToken, currentPath, navigate, allowInternalNavigationRef } = input;
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [seats, setSeats] = useState<SeatResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    let isMounted = true;

    function navigateToEventDetailForExpiredSession(reason?: string) {
      allowInternalNavigationRef.current = true;
      clearQueueToken(eventId);
      navigate(`/events/${eventId}`, {
        replace: true,
        state: {
          seatSessionExpired: true,
          reason: reason || EXPIRED_NOTICE_MESSAGE,
        },
      });
    }

    async function loadDetail() {
      if (!queueToken) {
        navigate(`/events/${eventId}`, { replace: true });
        return;
      }

      setIsLoading(true);
      setPageError('');

      try {
        const [eventResponse, initialSeatsResponse] = await Promise.all([
          fetchEventDetail(eventId, authToken || undefined),
          fetchEventSeats(eventId, authToken || undefined, queueToken),
        ]);
        let resolvedSeats = initialSeatsResponse;
        let resolvedQueueToken = queueToken;

        if (resolvedSeats.length === 0) {
          const queueStatus = await checkQueueStatus(eventId, resolvedQueueToken, authToken || undefined);

          if (!isMounted) {
            return;
          }

          setQueueToken(eventId, queueStatus.token);
          resolvedQueueToken = queueStatus.token;

          if (queueStatus.phase === 'WAITING') {
            allowInternalNavigationRef.current = true;
            navigate(`/events/${eventId}/seats/queue`, {
              replace: true,
              state: { token: queueStatus.token },
            });
            return;
          }

          resolvedSeats = await fetchEventSeats(eventId, authToken || undefined, resolvedQueueToken);
        }

        if (!isMounted) {
          return;
        }

        setEvent(eventResponse);
        setSeats(resolvedSeats);
      } catch (liveError) {
        if (!isMounted) {
          return;
        }

        if (isSessionExpiredError(liveError)) {
          promptSessionExpired({
            fromPath: currentPath,
            requiresAuthRoute: true,
          });
          return;
        }

        const message = liveError instanceof Error ? liveError.message : '좌석 정보를 불러오지 못했습니다.';
        if (isQueueTokenError(message)) {
          navigateToEventDetailForExpiredSession(message);
          return;
        }

        setPageError(message);
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
  }, [allowInternalNavigationRef, authToken, currentPath, eventId, navigate, queueToken]);

  return {
    event,
    seats,
    isLoading,
    pageError,
  };
}
