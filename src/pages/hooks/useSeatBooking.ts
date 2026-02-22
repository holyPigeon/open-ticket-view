import { MutableRefObject, useCallback, useState } from 'react';
import { NavigateFunction } from 'react-router-dom';
import { SeatResponse } from '../../api/contracts';
import { submitBooking } from '../../api/openTicketApi';
import { clearQueueToken, getQueueToken } from '../../auth/queueStorage';
import { isSessionExpiredError, promptSessionExpired } from '../../auth/session';
import { EXPIRED_NOTICE_MESSAGE } from '../seatSelection.constants';
import { isQueueTokenError } from '../seatSelection.utils';

type BookingFeedback = {
  tone: 'success' | 'error';
  message: string;
};

type UseSeatBookingInput = {
  eventId: number;
  authToken?: string;
  queueToken: string;
  currentPath: string;
  navigate: NavigateFunction;
  selectedSeats: SeatResponse[];
  allowInternalNavigationRef: MutableRefObject<boolean>;
  onSuccess?: () => void;
};

type UseSeatBookingOutput = {
  bookingPending: boolean;
  bookingFeedback: BookingFeedback | null;
  handleBookSeats: () => Promise<void>;
  resetBookingFeedback: () => void;
};

export function useSeatBooking(input: UseSeatBookingInput): UseSeatBookingOutput {
  const { eventId, authToken, queueToken, currentPath, navigate, selectedSeats, allowInternalNavigationRef, onSuccess } = input;
  const [bookingPending, setBookingPending] = useState(false);
  const [bookingFeedback, setBookingFeedback] = useState<BookingFeedback | null>(null);

  const handleBookSeats = useCallback(async () => {
    if (selectedSeats.length === 0) {
      return;
    }

    setBookingPending(true);
    setBookingFeedback(null);

    try {
      const activeQueueToken = getQueueToken(eventId) ?? queueToken;
      await submitBooking(eventId, { seatIds: selectedSeats.map((seat) => seat.id) }, authToken || undefined, activeQueueToken);
      setBookingFeedback({ tone: 'success', message: '예매가 완료되었습니다.' });
      onSuccess?.();
    } catch (error) {
      if (isSessionExpiredError(error)) {
        promptSessionExpired({
          fromPath: currentPath,
          requiresAuthRoute: true,
        });
        return;
      }

      const message = error instanceof Error ? error.message : '예매에 실패했습니다.';

      if (isQueueTokenError(message)) {
        allowInternalNavigationRef.current = true;
        clearQueueToken(eventId);
        navigate(`/events/${eventId}`, {
          replace: true,
          state: {
            seatSessionExpired: true,
            reason: message || EXPIRED_NOTICE_MESSAGE,
          },
        });
        return;
      }

      setBookingFeedback({ tone: 'error', message });
    } finally {
      setBookingPending(false);
    }
  }, [
    allowInternalNavigationRef,
    authToken,
    currentPath,
    eventId,
    navigate,
    onSuccess,
    queueToken,
    selectedSeats,
  ]);

  const resetBookingFeedback = useCallback(() => {
    setBookingFeedback(null);
  }, []);

  return {
    bookingPending,
    bookingFeedback,
    handleBookSeats,
    resetBookingFeedback,
  };
}
