import makeDeferred from './makeDeferred';
import Queue from './Queue';

/**
 * Utils
 */

function timeout(delay) {
  const { resolve, promise } = makeDeferred();
  setTimeout(() => void resolve(Date.now()), delay);
  return promise;
}

/**
 * Tests
 */

const threshold = 2400;

// Fake timers make these tests deterministic: with real timers the elapsed
// assertions depend on wall-clock scheduling and flake on busy CI runners
// (a 2400ms setTimeout can take more than 4800ms to fire under load).
// jest's modern fake timers also mock Date.now, so advanceTimersByTime moves
// the timers and the clock together and elapsed is exactly the timeout delay.

describe('Queue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Todo: comment due to wrong implementation
  // it('should bind functions to the queue', async () => {
  //   const queue = new Queue(2);
  //   const mockedTimeout = jest.fn(timeout);
  //   const timer = queue.bind(mockedTimeout);
  //   const start = Date.now();
  //   timer(threshold).then(now => {
  //     const elapsed = now - start;
  //     expect(elapsed >= threshold && elapsed <= 2 * threshold).toBe(true);
  //   });
  //   const end = await timer(threshold);
  //   expect(end - start >= 2 * threshold).toBe(true);
  //   expect(mockedTimeout).toHaveBeenCalledTimes(2);
  // });
  it('should prevent task execution when queue limit is reached', async () => {
    const queue = new Queue(1);
    const mockedTimeout = jest.fn(timeout);
    const timer = queue.bind(mockedTimeout);
    const start = Date.now();
    const promise = timer(threshold).then(time => time - start);
    // The queue is full, so the second call rejects without waiting. Awaiting
    // the rejection also flushes the microtasks that register the first
    // task's setTimeout, so it can be advanced below.
    await expect(timer(threshold)).rejects.toThrow('Queue limit reached');
    expect(Date.now() - start < threshold).toBe(true);
    jest.advanceTimersByTime(threshold);
    const elapsed = await promise;
    expect(elapsed).toBe(threshold);
    expect(mockedTimeout).toHaveBeenCalledTimes(1);
  });
  it('should safely bind tasks to the queue', async () => {
    const queue = new Queue(1);
    const mockedErrorHandler = jest.fn();
    const mockedTimeout = jest.fn(timeout);
    const timer = queue.bindSafe(mockedTimeout, mockedErrorHandler);
    const start = Date.now();
    const promise = timer(threshold).then(time => time - start);
    await timer(threshold);
    expect(Date.now() - start < threshold).toBe(true);
    expect(mockedErrorHandler).toHaveBeenCalledTimes(1);
    expect(mockedErrorHandler).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ message: 'Queue limit reached' })
    );
    jest.advanceTimersByTime(threshold);
    const elapsed = await promise;
    expect(elapsed).toBe(threshold);
    expect(mockedTimeout).toHaveBeenCalledTimes(1);
  });
});
