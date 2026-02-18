import { z } from 'zod';
import { TicketClient } from './client';
import {
  BookingCreateRequest,
  EventResponse,
  LoginRequest,
  LoginResponse,
  SeatResponse,
  bookingCreateSchema,
  eventSchema,
  loginRequestSchema,
  loginResponseSchema,
  seatSchema,
} from './contracts';

const bookingResponseSchema = z.object({
  id: z.number(),
});

type BookingResponse = z.infer<typeof bookingResponseSchema>;

export function createTicketClient(authToken?: string, queueToken?: string) {
  return new TicketClient({
    baseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
    authToken,
    queueToken,
  });
}

export async function fetchEventDetail(eventId: number, authToken?: string): Promise<EventResponse> {
  const client = createTicketClient(authToken);
  const result = await client.get(`/api/v1/events/${eventId}`, eventSchema);
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
