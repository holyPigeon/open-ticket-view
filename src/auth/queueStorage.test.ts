import { describe, expect, it } from 'vitest';
import { clearQueueToken, getQueueToken, setQueueToken } from './queueStorage';

describe('queue token storage helpers', () => {
  it('stores and reads queue token per event', () => {
    setQueueToken(1, 'queue-token-1');

    expect(getQueueToken(1)).toBe('queue-token-1');
  });

  it('clears queue token per event', () => {
    setQueueToken(1, 'queue-token-1');
    clearQueueToken(1);

    expect(getQueueToken(1)).toBeNull();
  });

  it('keeps tokens isolated across event ids', () => {
    setQueueToken(1, 'queue-token-1');
    setQueueToken(2, 'queue-token-2');

    expect(getQueueToken(1)).toBe('queue-token-1');
    expect(getQueueToken(2)).toBe('queue-token-2');
  });
});
