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

describe('Queue', () => {
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
  //   expect(mockedTimeout).toBeCalledTimes(2);
  // });
  it('should prevent task execution when queue limit is reached', async () => {
    const queue = new Queue(1);
    const mockedTimeout = jest.fn(timeout);
    const timer = queue.bind(mockedTimeout);
    const start = Date.now();
    const promise = timer(threshold).then(time => time - start);
    try {
      await timer(threshold);
    } catch (e) {
      expect(Date.now() - start < threshold).toBe(true);
      expect(e.message).toBe('Queue limit reached');
    }
    const elapsed = await promise;
    expect(elapsed >= threshold && elapsed < 2 * threshold).toBe(true);
    expect(mockedTimeout).toBeCalledTimes(1);
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
    expect(mockedErrorHandler).toBeCalledTimes(1);
    expect(mockedErrorHandler).nthCalledWith(
      1,
      expect.objectContaining({ message: 'Queue limit reached' })
    );
    const elapsed = await promise;
    expect(elapsed >= threshold && elapsed < 2 * threshold).toBe(true);
    expect(mockedTimeout).toBeCalledTimes(1);
  });
});
