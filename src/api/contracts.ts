import { z } from 'zod';

export const categorySchema = z.enum(['CONCERT', 'SPORTS']);
export type Category = z.infer<typeof categorySchema>;

export const seatStatusSchema = z.enum(['AVAILABLE', 'BOOKED', 'SOLD']);
export type SeatStatus = z.infer<typeof seatStatusSchema>;

export const eventSchema = z.object({
  id: z.number(),
  title: z.string(),
  category: categorySchema,
  startAt: z.string(),
  endAt: z.string(),
  venue: z.string(),
});
export type EventResponse = z.infer<typeof eventSchema>;

export const seatSchema = z.object({
  id: z.number(),
  event: eventSchema,
  seatNumber: z.string(),
  price: z.number(),
  status: seatStatusSchema,
});
export type SeatResponse = Omit<z.infer<typeof seatSchema>, 'status'> & { status: SeatStatus };

export const bookingCreateSchema = z.object({
  seatIds: z.array(z.number()),
});
export type BookingCreateRequest = z.infer<typeof bookingCreateSchema>;

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const loginResponseSchema = z.object({
  token: z.string(),
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const apiEnvelopeSchema = <T extends z.ZodTypeAny>(inner: T) =>
  z.object({
    code: z.number(),
    status: z.string(),
    message: z.string(),
    data: inner,
  });

export type ApiResponse<T> = {
  code: number;
  status: string;
  message: string;
  data: T;
};

export type TicketClientConfig = {
  baseUrl: string;
  authToken?: string;
  queueToken?: string;
};

export type ApiMode = 'LIVE' | 'MOCK';
