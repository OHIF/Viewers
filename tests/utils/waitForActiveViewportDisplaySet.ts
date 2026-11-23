import type { Page } from '@playwright/test';

/** Waits until the active viewport in the viewport grid has at least one display set. */
export const waitForActiveViewportDisplaySet = (page: Page) =>
  page.waitForFunction(() => {
    const state = (window as any).services?.viewportGridService?.getState();
    return !!state?.viewports.get(state.activeViewportId)?.displaySetInstanceUIDs?.length;
  });
