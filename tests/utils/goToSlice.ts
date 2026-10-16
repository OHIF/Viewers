import type { Page } from '@playwright/test';
import { expect } from 'playwright-test-coverage';
import type { IViewportPageObject } from '../pages/ViewportPageObject';
import { waitForViewportsRendered } from './waitForViewportsRendered';

/**
 * Jumps the viewport to the given slice, waits for it to render there, and checks that its
 * instance number overlay shows the expected text, such as 'I:11 (11/128)'.
 */
export async function goToSlice({
  page,
  viewport,
  slice,
}: {
  page: Page;
  viewport: IViewportPageObject;
  slice: { index: number; text: string };
}) {
  await viewport.sliceNavigation.toSlice(slice.index);
  await waitForViewportsRendered(page);
  await expect(viewport.overlayText.bottomRight.instanceNumber).toHaveText(slice.text);
}
