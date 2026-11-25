import type { Page } from '@playwright/test';

/**
 * Starts listening for the next ANNOTATION_COMPLETED. Call it before the clicks or drags that
 * draw one annotation, then await `wait()` once they are done. By then the tool has recorded the
 * annotation's undo entry, so an undo right after takes back the finished annotation.
 *
 * @param page - The Playwright page.
 * @returns `wait()`, which resolves once the event has fired, or fails after 10 seconds.
 */
export async function waitForAnnotationCompleted(page: Page) {
  const state = await page.evaluateHandle(() => {
    const state = { completed: false };
    const { eventTarget } = (window as any).cornerstone;
    const { ANNOTATION_COMPLETED } = (window as any).cornerstoneTools.Enums.Events;
    eventTarget.addEventListenerOnce(ANNOTATION_COMPLETED, () => {
      state.completed = true;
    });
    return state;
  });

  return {
    wait: async () => {
      await page.waitForFunction(state => state.completed, state, { timeout: 10_000 });
    },
  };
}
