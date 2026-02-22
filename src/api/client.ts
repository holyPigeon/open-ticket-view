import { ZodType } from 'zod';
import { ApiResponse, TicketClientConfig, apiEnvelopeSchema } from './contracts';

export type RequestHeadersInput = {
  authToken?: string;
  queueToken?: string;
  eventId?: number;
};

type PostRequestOptions = {
  keepalive?: boolean;
};

export class ApiHttpError extends Error {
  readonly status: number;
  readonly path?: string;

  constructor(status: number, message: string, path?: string) {
    super(message);
    this.name = 'ApiHttpError';
    this.status = status;
    this.path = path;
  }
}

export function buildRequestHeaders(input: RequestHeadersInput): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (input.authToken) {
    headers.Authorization = `Bearer ${input.authToken}`;
  }

  if (input.queueToken) {
    headers['X-Queue-Token'] = input.queueToken;
  }

  if (typeof input.eventId === 'number') {
    headers['X-Event-Id'] = String(input.eventId);
  }

  return headers;
}

export class TicketClient {
  private readonly baseUrl: string;
  private readonly authToken?: string;
  private readonly queueToken?: string;

  constructor(config: TicketClientConfig) {
    this.baseUrl = config.baseUrl;
    this.authToken = config.authToken;
    this.queueToken = config.queueToken;
  }

  async get<T>(path: string, schema: ZodType<T, any, unknown>, eventId?: number): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      cache: 'no-store',
      headers: buildRequestHeaders({
        authToken: this.authToken,
        queueToken: this.queueToken,
        eventId,
      }),
    });

    const json = await response.json();

    if (!response.ok) {
      throw new ApiHttpError(response.status, json?.message ?? `Request failed with status ${response.status}`, path);
    }

    return apiEnvelopeSchema(schema).parse(json) as ApiResponse<T>;
  }

  async post<TPayload, TResponse>(
    path: string,
    payload: TPayload,
    responseSchema: ZodType<TResponse, any, unknown>,
    eventId?: number,
    options?: PostRequestOptions
  ): Promise<ApiResponse<TResponse>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: buildRequestHeaders({
        authToken: this.authToken,
        queueToken: this.queueToken,
        eventId,
      }),
      body: JSON.stringify(payload),
      keepalive: options?.keepalive,
    });

    const json = await response.json();

    if (!response.ok) {
      throw new ApiHttpError(response.status, json?.message ?? `Request failed with status ${response.status}`, path);
    }

    return apiEnvelopeSchema(responseSchema).parse(json) as ApiResponse<TResponse>;
  }
}
