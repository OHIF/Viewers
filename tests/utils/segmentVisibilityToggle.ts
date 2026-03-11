import { Page } from '@playwright/test';
import { RightPanelPageObject } from '../pages';

const TOGGLE_TIMEOUT = 1000;

const toggleAllSegmentsVisibility = async (
  rightPanelPageObject: RightPanelPageObject,
  page: Page
) => {
  await rightPanelPageObject.contourSegmentationPanel.segmentsVisibilityToggle.click();
  await page.waitForTimeout(TOGGLE_TIMEOUT);
};

const toggleSegmentVisibility = async (
  segment: ReturnType<RightPanelPageObject['contourSegmentationPanel']['panel']['nthSegment']>,
  page: Page
) => {
  await segment.toggleVisibility();
  await page.waitForTimeout(TOGGLE_TIMEOUT);
};

export { toggleAllSegmentsVisibility, toggleSegmentVisibility };
