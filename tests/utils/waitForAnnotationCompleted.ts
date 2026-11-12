import type { Page } from '@playwright/test';

/**
 * Runs `action` and resolves on the next ANNOTATION_COMPLETED. By then the tool has recorded the
 * annotation's undo entry, so an undo right after this takes back the finished annotation.
 *
 * @param page - The Playwright page.
 * @param action - The clicks or drags that draw one annotation.
 * @param timeout - Milliseconds to wait for the event after `action` resolves (default 10000).
 */
export async function waitForAnnotationCompleted({
  page,
  action,
  timeout = 10_000,
}: {
  page: Page;
  action: () => Promise<void>;
  timeout?: number;
}) {
  // Listen before acting, so the event can't fire before the listener is attached.
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
  try {
    await action();
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
}
