import type { Page } from '@playwright/test';
import { expect } from 'playwright-test-coverage';

import { getViewportCanvasStats } from './getViewportCanvasStats';
import { waitForViewportsRendered } from './waitForViewportsRendered';

// Cornerstone can report a viewport 'rendered' while its image is still loading and the canvas is black.
// Wait for real pixels before drawing, since clicks on an empty viewport produce wrong measurements.
export async function waitForViewportPainted(page: Page, viewportId = 'default') {
  await waitForViewportsRendered(page);
  await expect
    .poll(async () => (await getViewportCanvasStats({ page, viewportId })).nonBlackRatio, {
      message: `Expected viewport ${viewportId} to paint its image`,
    })
    .toBeGreaterThan(0);
}
