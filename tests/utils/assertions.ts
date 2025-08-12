import { Page } from '@playwright/test';
import { expect } from 'playwright-test-coverage';

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
  await expect(page.locator('css=div[data-cy^="ModalityLoadBadge-"]')).toHaveCount(expectedCount);
}
