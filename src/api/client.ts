import { ZodType } from 'zod';
import { ApiResponse, TicketClientConfig, apiEnvelopeSchema } from './contracts';

export type RequestHeadersInput = {
  authToken?: string;
  queueToken?: string;
  eventId?: number;
};

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

  async get<T>(path: string, schema: ZodType<T>, eventId?: number): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: buildRequestHeaders({
        authToken: this.authToken,
        queueToken: this.queueToken,
        eventId,
      }),
    });

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json?.message ?? `Request failed with status ${response.status}`);
    }

    return apiEnvelopeSchema(schema).parse(json) as ApiResponse<T>;
  }

  async post<TPayload, TResponse>(
    path: string,
    payload: TPayload,
    responseSchema: ZodType<TResponse>,
    eventId?: number
  ): Promise<ApiResponse<TResponse>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: buildRequestHeaders({
        authToken: this.authToken,
        queueToken: this.queueToken,
        eventId,
      }),
      body: JSON.stringify(payload),
    });

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json?.message ?? `Request failed with status ${response.status}`);
    }

    return apiEnvelopeSchema(responseSchema).parse(json) as ApiResponse<TResponse>;
  }
}
