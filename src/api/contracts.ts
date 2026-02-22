import { z } from 'zod';

export const categorySchema = z.enum(['CONCERT', 'SPORTS']);
export type Category = z.infer<typeof categorySchema>;

export const seatStatusSchema = z.enum(['AVAILABLE', 'BOOKED', 'SOLD']);
export type SeatStatus = z.infer<typeof seatStatusSchema>;

function sanitizeImageUrl(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveApiBaseUrl(): string {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  return 'http://localhost:8080';
}

function normalizeImageUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    return new URL(value, resolveApiBaseUrl()).toString();
  } catch {
    return value;
  }
}

export const eventSchema = z
  .object({
    id: z.number(),
    title: z.string(),
    category: categorySchema,
    startAt: z.string(),
    endAt: z.string(),
    venue: z.string(),
    imageUrl: z.string().optional().nullable(),
    posterImageUrl: z.string().optional().nullable(),
  })
  .transform((input) => {
    const selectedImageUrl = sanitizeImageUrl(input.posterImageUrl) ?? sanitizeImageUrl(input.imageUrl);

    return {
      id: input.id,
      title: input.title,
      category: input.category,
      startAt: input.startAt,
      endAt: input.endAt,
      venue: input.venue,
      posterImageUrl: normalizeImageUrl(selectedImageUrl),
    };
  });
export type EventResponse = z.infer<typeof eventSchema>;

export const queuePhaseSchema = z.enum(['WAITING', 'ALLOWED']);
export type QueuePhase = z.infer<typeof queuePhaseSchema>;

export const queueStatusSchema = z.object({
  token: z.string(),
  phase: queuePhaseSchema,
  position: z.number(),
  remainingSeconds: z.number(),
});
export type QueueStatusResponse = z.infer<typeof queueStatusSchema>;

export const queueLeaveRequestSchema = z.object({
  queueToken: z.string(),
});
export type QueueLeaveRequest = z.infer<typeof queueLeaveRequestSchema>;

export const queueLeaveResponseSchema = z.object({}).passthrough();
export type QueueLeaveResponse = z.infer<typeof queueLeaveResponseSchema>;

export const pageSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    content: z.array(itemSchema),
    pageable: z.object({
      pageNumber: z.number(),
      pageSize: z.number(),
      offset: z.number(),
      paged: z.boolean(),
      unpaged: z.boolean(),
      sort: z.object({
        sorted: z.boolean(),
        unsorted: z.boolean(),
        empty: z.boolean(),
      }),
    }),
    totalPages: z.number(),
    totalElements: z.number(),
    last: z.boolean(),
    first: z.boolean(),
    number: z.number(),
    size: z.number(),
    numberOfElements: z.number(),
    empty: z.boolean(),
    sort: z.object({
      sorted: z.boolean(),
      unsorted: z.boolean(),
      empty: z.boolean(),
    }),
  });

export type PageResponse<T> = {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  first: boolean;
  number: number;
  size: number;
  numberOfElements: number;
  empty: boolean;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
};

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

export type EventListQuery = {
  page?: number;
  size?: number;
  sort?: string;
  title?: string;
  category?: Category;
  venue?: string;
};
