import { Page } from '@playwright/test';
import { expect } from 'playwright-test-coverage';

import { FloatingElementsPageObject } from '../pages';

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
  const floatingElementsPageObject = new FloatingElementsPageObject(page);
  const count = await floatingElementsPageObject.viewport.getModalityLoadBadgeCount();

  expect(count).toBe(expectedCount);
}
