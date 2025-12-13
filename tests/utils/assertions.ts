import { Page } from '@playwright/test';
import { expect } from 'playwright-test-coverage';

import { DOMOverlayPageObject } from '../pages';

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
  const domOverlayPageObject = new DOMOverlayPageObject(page);
  const count = await domOverlayPageObject.viewport.getModalityLoadBadgeCount();

  expect(count).toBe(expectedCount);
}
