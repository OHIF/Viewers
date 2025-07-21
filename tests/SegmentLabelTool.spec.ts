import { test } from 'playwright-test-coverage';
import { visitStudy, checkForScreenshot, screenShotPaths } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.256467663913010332776401703474716742458';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should use segmentLabelTool correctly', async ({ page }) => {
  await page.getByTestId('side-panel-header-right').click();
  await page.getByTestId('study-browser-thumbnail-no-image').dblclick();

  await page.evaluate(() => {
    // Access cornerstone directly from the window object
    const cornerstone = window.cornerstone;
    if (!cornerstone) {
      return;
    }

    const enabledElements = cornerstone.getEnabledElements();
    if (enabledElements.length === 0) {
      return;
    }

    const viewport = enabledElements[0].viewport;
    if (viewport) {
      viewport.setZoom(4);
      viewport.render();
    }
  });

  await page.getByTestId('yes-hydrate-btn').click();

  await page.waitForTimeout(2_000);

  await page.getByTestId('panelSegmentation-btn').click();
  await page.getByTestId('segmentation-settings-btn').click();
  await page.getByTestId('show-segment-label-btn').click();

  await page.mouse.click(680, 390, { delay: 2000 });

  await checkForScreenshot(page, page, screenShotPaths.segmentLabelTool.segmentLabel);
});
