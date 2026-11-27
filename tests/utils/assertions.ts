import { Locator, Page } from '@playwright/test';
import { expect } from 'playwright-test-coverage';

import { DOMOverlayPageObject } from '../pages';
import type { RightPanelPageObject, SegmentationSelect } from '../pages/RightPanelPageObject';
import type { IViewportPageObject } from '../pages/ViewportPageObject';
import { waitForRenderCycleForAction, waitForViewportsRendered } from './waitForViewportsRendered';

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

export async function expectRowSelected(rowObject) {
  await expect(rowObject.locator).toContainClass('bg-popover');
}

export async function expectRowLocked(rowObject: { lockIcon: Locator }) {
  await expect(rowObject.lockIcon, 'Expected the row to show the lock icon').toHaveCount(1);
}

export async function expectRowUnlocked(rowObject: { lockIcon: Locator }) {
  await expect(rowObject.lockIcon, 'Expected the row to not show the lock icon').toHaveCount(0);
}

export async function expectRowNotSelected(rowObject) {
  await expect(rowObject.locator).not.toContainClass('bg-popover');
}

// Opens the segmentation selector, asserts its options match `labels`, then closes it.
export async function expectSegmentationLabels(
  segmentationSelect: SegmentationSelect,
  labels: string[]
) {
  const options = await segmentationSelect.getSegmentationLabels();
  await expect(options).toHaveText(labels);
  await segmentationSelect.close();
}

/** Asserts that the viewport pane is the active one in the grid. */
export async function expectViewportActive(pane: Locator) {
  await expect(pane, 'Expected the viewport to be active').toHaveAttribute(
    'data-is-active',
    'true'
  );
}

type LabelmapPaintedParams = {
  page: Page;
  /** Must be the active viewport, which is the only one the panel's eye toggle applies to. */
  viewport: IViewportPageObject;
  labelMapSegmentationPanel: RightPanelPageObject['labelMapSegmentationPanel'];
};

/**
 * Hides and re-shows the selected labelmap with the all-segments eye toggle and compares the
 * viewport's canvas digests.
 */
async function hideAndShowLabelmap({
  page,
  viewport,
  labelMapSegmentationPanel,
  painted,
}: LabelmapPaintedParams & { painted: boolean }) {
  await expectViewportActive(viewport.pane);
  const { segmentsVisibilityToggle } = labelMapSegmentationPanel;
  const digest = () => viewport.getCanvasDigest();
  // Let a render still in flight (e.g. the tail of a brush stroke) land before saving the frame.
  await waitForViewportsRendered(page);
  const shownDigest = await digest();

  await waitForRenderCycleForAction(page, () => segmentsVisibilityToggle.click());
  if (painted) {
    await expect
      .poll(digest, { message: 'Hiding the labelmap changed nothing' })
      .not.toBe(shownDigest);
  } else {
    await expect
      .poll(digest, { message: 'Hiding the labelmap changed the frame' })
      .toBe(shownDigest);
  }

  await waitForRenderCycleForAction(page, () => segmentsVisibilityToggle.click());
  await expect
    .poll(digest, { message: 'Showing the labelmap did not restore the frame' })
    .toBe(shownDigest);
}

/** Asserts that the selected labelmap paints pixels on the (active) viewport. */
export async function expectLabelmapPainted(params: LabelmapPaintedParams) {
  await hideAndShowLabelmap({ ...params, painted: true });
}

/** Asserts that the selected labelmap paints nothing, not even a stale frame, on the viewport. */
export async function expectNoLabelmapPainted(params: LabelmapPaintedParams) {
  await hideAndShowLabelmap({ ...params, painted: false });
}
