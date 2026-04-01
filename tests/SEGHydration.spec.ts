import { screenShotPaths, test, visitStudyRendered } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.256467663913010332776401703474716742458';
  await visitStudyRendered(page, studyInstanceUID);
});

test('should hydrate SEG reports correctly', async ({
  page,
  DOMOverlayPageObject,
  leftPanelPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await rightPanelPageObject.toggle();
  await leftPanelPageObject.loadSeriesByDescription('SEG');

  await viewportPageObject.checkForScreenshot(screenShotPaths.segHydration.segPreHydration);

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

  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();

  await mainToolbarPageObject.waitForViewportsRendered();
  await viewportPageObject.checkForScreenshot(screenShotPaths.segHydration.segPostHydration);
});
