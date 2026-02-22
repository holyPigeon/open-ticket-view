import { useCallback, useState } from 'react';
import { NavigateFunction } from 'react-router-dom';
import { enterQueue } from '../../api/openTicketApi';
import { setQueueToken } from '../../auth/queueStorage';
import { getAuthToken } from '../../auth/storage';
import { isSessionExpiredError, promptSessionExpired } from '../../auth/session';
import { showGlobalTopBanner } from '../../components/globalUiStore';

type UseStartBookingInput = {
  eventId: number;
  pathname: string;
  navigate: NavigateFunction;
};

type UseStartBookingOutput = {
  bookingStartPending: boolean;
  handleStartBooking: () => Promise<void>;
};

export function useStartBooking(input: UseStartBookingInput): UseStartBookingOutput {
  const { eventId, pathname, navigate } = input;
  const [bookingStartPending, setBookingStartPending] = useState(false);

  const handleStartBooking = useCallback(async () => {
    const authToken = getAuthToken();
    if (!authToken) {
      navigate('/login', { replace: true, state: { from: `/events/${eventId}` } });
      return;
    }

    setBookingStartPending(true);

    try {
      const queueStatus = await enterQueue(eventId, authToken);
      setQueueToken(eventId, queueStatus.token);

      if (queueStatus.phase === 'WAITING') {
        navigate(`/events/${eventId}/seats/queue`, {
          replace: true,
          state: { token: queueStatus.token },
        });
        return;
      }

      navigate(`/events/${eventId}/seats`, { replace: true });
    } catch (error) {
      if (isSessionExpiredError(error)) {
        promptSessionExpired({
          fromPath: pathname,
          requiresAuthRoute: false,
        });
        return;
      }

      showGlobalTopBanner({
        tone: 'error',
        message: error instanceof Error ? error.message : '대기열 진입에 실패했습니다.',
      });
    } finally {
      setBookingStartPending(false);
    }
  }, [eventId, navigate, pathname]);

  return {
    bookingStartPending,
    handleStartBooking,
  };
}
