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

/**
 * Asserts that one bounding box is completely contained within another.
 * Checks that all edges of the inner box are within the outer box boundaries.
 */
export async function assertBoundingBoxIsContainedWithin({
  innerBox,
  outerBox,
  innerBoxLabel = 'inner element',
  outerBoxLabel = 'outer element',
}: {
  innerBox: { x: number; y: number; width: number; height: number } | null;
  outerBox: { x: number; y: number; width: number; height: number } | null;
  innerBoxLabel?: string;
  outerBoxLabel?: string;
}) {
  expect(innerBox).not.toBeNull();
  expect(outerBox).not.toBeNull();

  if (!outerBox || !innerBox) {
    return;
  }

  expect(
    innerBox.x,
    `${innerBoxLabel} left edge should be within ${outerBoxLabel}`
  ).toBeGreaterThanOrEqual(outerBox.x);

  expect(
    innerBox.y,
    `${innerBoxLabel} top edge should be within ${outerBoxLabel}`
  ).toBeGreaterThanOrEqual(outerBox.y);

  expect(
    innerBox.x + innerBox.width,
    `${innerBoxLabel} right edge should be within ${outerBoxLabel}`
  ).toBeLessThanOrEqual(outerBox.x + outerBox.width);

  expect(
    innerBox.y + innerBox.height,
    `${innerBoxLabel} bottom edge should be within ${outerBoxLabel}`
  ).toBeLessThanOrEqual(outerBox.y + outerBox.height);
}
