import { MutableRefObject, useCallback, useEffect, useRef } from 'react';
import { useBeforeUnload, useBlocker } from 'react-router-dom';
import { leaveQueue } from '../../api/openTicketApi';
import { clearQueueToken, getQueueToken } from '../../auth/queueStorage';
import { LEAVE_SEAT_SELECTION_MESSAGE } from '../seatSelection.constants';

type UseSeatNavigationGuardInput = {
  eventId: number;
  authToken?: string;
};

type UseSeatNavigationGuardOutput = {
  allowInternalNavigationRef: MutableRefObject<boolean>;
};

export function useSeatNavigationGuard(input: UseSeatNavigationGuardInput): UseSeatNavigationGuardOutput {
  const { eventId, authToken } = input;
  const allowInternalNavigationRef = useRef(false);
  const leaveInProgressRef = useRef(false);

  const leaveQueueAndClearToken = useCallback(
    async (options?: { keepalive?: boolean }) => {
      const token = getQueueToken(eventId);
      if (!token) {
        clearQueueToken(eventId);
        return;
      }

      try {
        await leaveQueue(eventId, token, authToken || undefined, options);
      } catch (error) {
        const message = error instanceof Error ? error.message : '대기열 이탈 API 호출 중 알 수 없는 오류가 발생했습니다.';
        console.warn(`[SeatSelectionPage] leave queue API failed: ${message}`);
      } finally {
        clearQueueToken(eventId);
      }
    },
    [authToken, eventId]
  );

  const leaveBlocker = useBlocker(
    () => !allowInternalNavigationRef.current && Boolean(getQueueToken(eventId))
  );

  useEffect(() => {
    if (leaveBlocker.state !== 'blocked' || leaveInProgressRef.current) {
      return;
    }

    const shouldLeave = window.confirm(LEAVE_SEAT_SELECTION_MESSAGE);
    if (!shouldLeave) {
      leaveBlocker.reset();
      return;
    }

    leaveInProgressRef.current = true;
    void leaveQueueAndClearToken().finally(() => {
      leaveBlocker.proceed();
    });
  }, [leaveBlocker, leaveQueueAndClearToken]);

  useBeforeUnload((event) => {
    if (allowInternalNavigationRef.current || !getQueueToken(eventId) || leaveInProgressRef.current) {
      return;
    }

    leaveInProgressRef.current = true;
    void leaveQueueAndClearToken({ keepalive: true });
    event.preventDefault();
    event.returnValue = '';
  });

  return {
    allowInternalNavigationRef,
  };
}
