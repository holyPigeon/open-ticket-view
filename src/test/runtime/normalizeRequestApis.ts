export function normalizeRequestApis(): void {
  if (typeof window === 'undefined' || typeof globalThis.Request !== 'function' || typeof globalThis.fetch !== 'function') {
    return;
  }

  const NativeRequest = globalThis.Request;
  const nativeFetch = globalThis.fetch;
  const NativeAbortController = globalThis.AbortController;
  const NativeAbortSignal = globalThis.AbortSignal;

  const normalizeInit = (init: RequestInit | undefined): RequestInit | undefined => {
    if (!init || !('signal' in init)) {
      return init;
    }

    const { signal: _signal, ...rest } = init;
    return rest;
  };

  const toInitFromInput = (input: Request): RequestInit => {
    const method = input.method || 'GET';

    return {
      method,
      headers: input.headers,
      cache: input.cache,
      credentials: input.credentials,
      integrity: input.integrity,
      keepalive: input.keepalive,
      mode: input.mode,
      redirect: input.redirect,
      referrer: input.referrer,
      body: method === 'GET' || method === 'HEAD' ? undefined : input.body,
    };
  };

  const RequestCompat = class extends NativeRequest {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
      if (
        typeof input === 'object' &&
        input !== null &&
        'url' in input &&
        'signal' in input &&
        (input as Request).signal
      ) {
        const inputRequest = input as Request;
        const mergedInit = { ...toInitFromInput(inputRequest), ...init };
        super(inputRequest.url, normalizeInit(mergedInit));
        return;
      }

      super(input, normalizeInit(init));
    }
  };

  const fetchCompat: typeof fetch = (input, init) => nativeFetch(input, normalizeInit(init));

  Object.defineProperty(globalThis, 'Request', { configurable: true, writable: true, value: RequestCompat });
  Object.defineProperty(globalThis, 'fetch', { configurable: true, writable: true, value: fetchCompat });

  Object.defineProperty(window, 'Request', { configurable: true, writable: true, value: RequestCompat });
  Object.defineProperty(window, 'fetch', { configurable: true, writable: true, value: fetchCompat });
  if (globalThis.Response) {
    Object.defineProperty(window, 'Response', { configurable: true, writable: true, value: globalThis.Response });
  }
  if (globalThis.Headers) {
    Object.defineProperty(window, 'Headers', { configurable: true, writable: true, value: globalThis.Headers });
  }
  if (NativeAbortController) {
    Object.defineProperty(window, 'AbortController', { configurable: true, writable: true, value: NativeAbortController });
  }
  if (NativeAbortSignal) {
    Object.defineProperty(window, 'AbortSignal', { configurable: true, writable: true, value: NativeAbortSignal });
  }
}
