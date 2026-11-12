import type { Page } from '@playwright/test';
import { expect } from 'playwright-test-coverage';

import { getViewportCanvasStats } from './getViewportCanvasStats';
import { waitForViewportsRendered } from './waitForViewportsRendered';

// Cornerstone can report a viewport 'rendered' while its image is still loading and the canvas is black.
// Wait for non-black pixels before drawing, since clicks on an empty viewport produce wrong measurements.
// The first non-black frame may still be partly drawn, so let its render settle before returning.
export async function waitForViewportNotBlank({
  page,
  viewportId = 'default',
}: {
  page: Page;
  viewportId?: string;
}) {
  await waitForViewportsRendered(page);
  await expect
    .poll(async () => (await getViewportCanvasStats({ page, viewportId })).nonBlackRatio, {
      message: `Expected viewport ${viewportId} to show non-black pixels`,
    })
    .toBeGreaterThan(0);
  await waitForViewportsRendered(page);
}
