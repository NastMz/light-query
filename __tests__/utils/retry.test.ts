// __tests__/utils/retry.test.ts
import { retry } from '../../src/utils/retry';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('retry()', () => {
  // Turn on fake timers for *each* test
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('succeeds without retries', async () => {
    const fn = vi.fn().mockResolvedValue(42);
    await expect(retry(fn, 3, 100)).resolves.toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure then succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockResolvedValue('ok');

    const promise = retry(fn, 2, 100);

    await vi.advanceTimersByTimeAsync(100);

    await expect(promise).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
