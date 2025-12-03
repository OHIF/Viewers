import { Page } from '@playwright/test';
import { expect } from 'playwright-test-coverage';

import { OverlayPageObject } from '../pages';

/**
 * Asserts the number of Modality Load Badges present on the page.
 */
export async function assertNumberOfModalityLoadBadges({
  page,
  expectedCount,
}: {
  page: Page;
  expectedCount: number;
}) {
  const overlayPageObject = new OverlayPageObject(page);
  const count = await overlayPageObject.viewport.getModalityLoadBadgeCount();

  expect(count).toBe(expectedCount);
}
