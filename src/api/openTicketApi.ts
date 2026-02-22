import { z } from 'zod';
import { TicketClient } from './client';
import {
  BookingCreateRequest,
  EventListQuery,
  PageResponse,
  EventResponse,
  LoginRequest,
  LoginResponse,
  QueueLeaveRequest,
  QueueLeaveResponse,
  QueueStatusResponse,
  SeatResponse,
  bookingCreateSchema,
  eventSchema,
  pageSchema,
  loginRequestSchema,
  loginResponseSchema,
  queueStatusSchema,
  queueLeaveRequestSchema,
  queueLeaveResponseSchema,
  seatSchema,
} from './contracts';

const bookingResponseSchema = z.object({
  id: z.number(),
});

type BookingResponse = z.infer<typeof bookingResponseSchema>;

export function createTicketClient(authToken?: string, queueToken?: string) {
  // In Vite dev, use relative path so requests go through dev-server proxy (/api -> :8080).
  const defaultBaseUrl = import.meta.env.DEV ? '' : 'http://localhost:8080';

  return new TicketClient({
    baseUrl: import.meta.env.VITE_API_BASE_URL ?? defaultBaseUrl,
    authToken,
    queueToken,
  });
}

function toQueryString(query?: EventListQuery): string {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(query?.page ?? 0));
  searchParams.set('size', String(query?.size ?? 10));
  searchParams.set('sort', query?.sort ?? 'id,desc');

  if (query?.title) {
    searchParams.set('title', query.title);
  }
  if (query?.category) {
    searchParams.set('category', query.category);
  }
  if (query?.venue) {
    searchParams.set('venue', query.venue);
  }

  return searchParams.toString();
}

export async function fetchEvents(query?: EventListQuery): Promise<PageResponse<EventResponse>> {
  const client = createTicketClient();
  const result = await client.get(`/api/v1/events?${toQueryString(query)}`, pageSchema(eventSchema));
  return result.data;
}

export async function fetchEventDetail(eventId: number, authToken?: string): Promise<EventResponse> {
  const client = createTicketClient(authToken);
  const result = await client.get(`/api/v1/events/${eventId}`, eventSchema);
  return result.data;
}

export async function enterQueue(eventId: number, authToken?: string): Promise<QueueStatusResponse> {
  const client = createTicketClient(authToken);
  const result = await client.post(`/api/v1/queue/events/${eventId}`, {}, queueStatusSchema);
  return result.data;
}

export async function checkQueueStatus(eventId: number, token: string, authToken?: string): Promise<QueueStatusResponse> {
  const client = createTicketClient(authToken);
  const encodedToken = encodeURIComponent(token);
  const cacheBuster = Date.now();
  const result = await client.get(`/api/v1/queue/events/${eventId}?token=${encodedToken}&_ts=${cacheBuster}`, queueStatusSchema);
  return result.data;
}

export async function leaveQueue(
  eventId: number,
  queueToken: string,
  authToken?: string,
  options?: { keepalive?: boolean }
): Promise<QueueLeaveResponse> {
  const client = createTicketClient(authToken);
  const payload = queueLeaveRequestSchema.parse({ queueToken }) as QueueLeaveRequest;
  const result = await client.post(`/api/v1/queue/events/${eventId}/leave`, payload, queueLeaveResponseSchema, undefined, options);
  return result.data;
}

export async function fetchEventSeats(
  eventId: number,
  authToken?: string,
  queueToken?: string
): Promise<SeatResponse[]> {
  const client = createTicketClient(authToken, queueToken);
  const result = await client.get(`/api/v1/events/${eventId}/seats`, z.array(seatSchema), eventId);
  return result.data;
}

export async function submitBooking(
  eventId: number,
  payload: BookingCreateRequest,
  authToken?: string,
  queueToken?: string
): Promise<BookingResponse> {
  bookingCreateSchema.parse(payload);
  const client = createTicketClient(authToken, queueToken);
  const result = await client.post('/api/v1/bookings', payload, bookingResponseSchema, eventId);
  return result.data;
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const requestBody = loginRequestSchema.parse(payload);
  const client = createTicketClient();
  const result = await client.post('/api/v1/auth/login', requestBody, loginResponseSchema);
  return result.data;
}
