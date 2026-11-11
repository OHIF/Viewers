import type { Page } from '@playwright/test';

/**
 * Runs `action` and resolves once Cornerstone fires ANNOTATION_COMPLETED for the annotation it
 * draws. Cornerstone records a new annotation's undo entry just before that event, so an undo
 * right after this takes back the finished annotation.
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
    const done = new Promise<void>(resolve =>
      eventTarget.addEventListenerOnce(ANNOTATION_COMPLETED, () => resolve())
    );
    return { done };
  });
  try {
    await action();
    await completed.evaluate(
      ({ done }, timeout) =>
        Promise.race([
          done,
          new Promise<void>((_, reject) =>
            setTimeout(
              () => reject(new Error(`ANNOTATION_COMPLETED did not fire within ${timeout}ms`)),
              timeout
            )
          ),
        ]),
      timeout
    );
  } finally {
    await completed.dispose();
  }
}
