import { QUEUE_TOKEN_ERROR_FRAGMENTS } from './seatSelection.constants';

export function parseSeatEventId(rawId: string | undefined): number {
  const parsed = Number(rawId);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function isQueueTokenError(message: string): boolean {
  return QUEUE_TOKEN_ERROR_FRAGMENTS.some((fragment) => message.includes(fragment));
}
