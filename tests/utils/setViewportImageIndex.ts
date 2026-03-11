import { Page } from '@playwright/test';

export async function setViewportImageIndex(
  page: Page,
  imageIndex: number,
  viewportIndex = 0
): Promise<void> {
  await page.evaluate(
    ({ imageIndex, viewportIndex }) => {
      const cornerstone = window.cornerstone;
      if (!cornerstone) {
        return;
      }
      const enabledElements = cornerstone.getEnabledElements();
      const viewport = enabledElements[viewportIndex]?.viewport;
      if (viewport?.setImageIdIndex) {
        viewport.setImageIdIndex(imageIndex);
        viewport.render();
      }
    },
    { imageIndex, viewportIndex }
  );
  await page.waitForTimeout(2000);
}
