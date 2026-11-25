import type { Page } from '@playwright/test';

/**
 * Starts listening for the next ANNOTATION_COMPLETED. Call it before the clicks or drags that
 * draw one annotation, then await `wait()` once they are done. By then the tool has recorded the
 * annotation's undo entry, so an undo right after takes back the finished annotation.
 *
 * @param page - The Playwright page.
 * @returns `wait(timeout)`, which resolves once the event has fired and removes the listener. It
 *   rejects if the event has not fired `timeout` ms after the call (default 10000).
 */
export async function waitForAnnotationCompleted(page: Page) {
  const completed = await page.evaluateHandle(() => {
    const { eventTarget } = (window as any).cornerstone;
    const { ANNOTATION_COMPLETED } = (window as any).cornerstoneTools.Enums.Events;
    let onCompleted = () => {};
    const done = new Promise<void>(resolve => {
      onCompleted = () => resolve();
      eventTarget.addEventListener(ANNOTATION_COMPLETED, onCompleted);
    });
    const stop = () => eventTarget.removeEventListener(ANNOTATION_COMPLETED, onCompleted);
    done.then(stop);
    return { done, stop };
  });

  return {
    wait: async (timeout = 10_000) => {
      try {
        await completed.evaluate(({ done }, timeout) => {
          let timer: ReturnType<typeof setTimeout>;
          const timedOut = new Promise<void>((_, reject) => {
            timer = setTimeout(
              () => reject(new Error(`ANNOTATION_COMPLETED did not fire within ${timeout}ms`)),
              timeout
            );
          });
          return Promise.race([done, timedOut]).finally(() => clearTimeout(timer));
        }, timeout);
      } finally {
        await completed.evaluate(({ stop }) => stop());
        await completed.dispose();
      }
    },
  };
}
