import { Page } from '@playwright/test';
import { expect } from 'playwright-test-coverage';

import type { DOMOverlayPageObject, LeftPanelPageObject } from '../pages';
import { visitStudy } from './visitStudy';
import { waitForViewportsRendered } from './waitForViewportsRendered';

// Visits a study and accepts the segmentation hydration prompt
export async function visitStudyAndHydrate({
  page,
  leftPanelPageObject,
  DOMOverlayPageObject,
  studyInstanceUID,
  modality,
  mode = 'segmentation',
}: {
  page: Page;
  leftPanelPageObject: LeftPanelPageObject;
  DOMOverlayPageObject: DOMOverlayPageObject;
  studyInstanceUID: string;
  modality: string;
  mode?: string;
}) {
  await visitStudy(page, studyInstanceUID, mode, 2000);

  await leftPanelPageObject.loadSeriesByModality(modality);
  await waitForViewportsRendered(page);
  await expect(DOMOverlayPageObject.viewport.segmentationHydration.locator).toBeVisible();

  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();
}
