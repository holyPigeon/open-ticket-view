function createMemoryStorage(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

function isValidStorage(candidate: unknown): candidate is Storage {
  return (
    typeof candidate === 'object' &&
    candidate !== null &&
    typeof (candidate as Storage).getItem === 'function' &&
    typeof (candidate as Storage).setItem === 'function' &&
    typeof (candidate as Storage).removeItem === 'function' &&
    typeof (candidate as Storage).clear === 'function'
  );
}

export function normalizeLocalStorage(): void {
  const browserStorage =
    typeof window !== 'undefined' && isValidStorage(window.localStorage) ? window.localStorage : null;
  const activeStorage = isValidStorage(globalThis.localStorage) ? globalThis.localStorage : null;
  const resolvedStorage = activeStorage ?? browserStorage ?? createMemoryStorage();

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: resolvedStorage,
  });

  if (typeof window !== 'undefined' && !isValidStorage(window.localStorage)) {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      writable: true,
      value: resolvedStorage,
    });
  }
}
