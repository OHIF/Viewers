import type { Page } from '@playwright/test';

/**
 * Adds a specified segmentation for a given viewport.
 * @param page - The Playwright page object.
 * @param viewportIndex - The zero-based index of the viewport (e.g., 2 for the third viewport).
 * @param segmentationName - The name of the segmentation to add (e.g., 'Contours on PET').
 */
export async function addSegmentationViaOverlayMenu(
  page: Page,
  viewportIndex: number,
  segmentationName: string,
  closeMenu: boolean = true
): Promise<void> {
  const viewportPane = page.getByTestId('viewport-pane').nth(viewportIndex);
  const viewportElement = viewportPane.locator('[data-viewportid]');
  const viewportId = await viewportElement.getAttribute('data-viewportid');

  if (!viewportId) {
    throw new Error(`Could not find data-viewportid for viewport index ${viewportIndex}`);
  }

  await viewportPane.click(); // Activate the viewport

  // Open menu
  await page.getByTestId(`dataOverlayMenu-${viewportId}-btn`).click();
  await page.getByTestId(`AddSegmentationDataOverlay-${viewportId}`).click();
  await page.getByText('SELECT A SEGMENTATION').click();

  // Click the desired segmentation by name
  await page.getByTestId(segmentationName).click();

  // Close the data overlay menu if requested
  if (closeMenu) {
    await page.getByTestId(`dataOverlayMenu-${viewportId}-btn`).click();
  }
}
