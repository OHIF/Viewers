import {
  test,
  visitStudy,
  checkForScreenshot,
  screenShotPaths,
  CLICK_NO_NAV_WAIT,
} from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID =
    '1.3.12.2.1107.5.2.32.35162.30000015050317233592200000046&hangingprotocolid=mpr';
  await visitStudy(page, studyInstanceUID);
});

test('should properly display MPR for MR', async ({ page, mainToolbarPageObject }) => {
  await mainToolbarPageObject.waitForVolumeLoad();
  await page.getByTestId('side-panel-header-right').click(CLICK_NO_NAV_WAIT);
  // await page.getByTestId('study-browser-thumbnail-no-image').dblclick();
  await checkForScreenshot(page, page, screenShotPaths.mpr2.mprDisplayedCorrectly);

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

    // Apply zoom to all viewports
    for (let i = 0; i < enabledElements.length; i++) {
      const viewport = enabledElements[i].viewport;
      if (viewport) {
        viewport.setZoom(4);
        viewport.render();
      }
    }
  });

  await checkForScreenshot(page, page, screenShotPaths.mpr2.mprDisplayedCorrectlyZoomed);
});
