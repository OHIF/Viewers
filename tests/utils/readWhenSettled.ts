import { expect } from 'playwright-test-coverage';

/**
 * Reads a value until two reads `interval` ms apart agree, then returns it. Use it to save a
 * reference after an edit, so the reference can't come from a render still in progress. A read
 * of null or undefined never counts as settled.
 *
 * @param read - Returns the value to settle; reads are compared with JSON.stringify.
 * @param interval - Milliseconds between reads (default 500).
 * @param message - Assertion message used if the value never settles.
 */
export async function readWhenSettled<T>({
  read,
  interval = 500,
  message,
}: {
  read: () => Promise<T>;
  interval?: number;
  message: string;
}): Promise<NonNullable<T>> {
  let previous: string | undefined;
  let value: T;
  await expect
    .poll(
      async () => {
        value = await read();
        const current = JSON.stringify(value);
        const settled = value != null && current === previous;
        previous = current;
        return settled;
      },
      { intervals: [interval], message }
    )
    .toBe(true);
  return value as NonNullable<T>;
}
