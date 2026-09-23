import {
  checkForViewportScreenshot,
  expect,
  screenShotPaths,
  test,
  visitStudy,
  waitForPaintToSettle,
  waitForViewportsRendered,
} from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.7695.4007.324475281161490036195179843543';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should hydrate SR reports correctly', async ({
  page,
  DOMOverlayPageObject,
  leftPanelPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await rightPanelPageObject.toggle();
  await rightPanelPageObject.measurementsPanel.select();
  await leftPanelPageObject.loadSeriesByModality('SR');
  // The DICOMSRDisplayTool bails out when the viewport has no actors yet
  // (see DICOMSRDisplayTool's hasActors guard), so we must wait until the
  // underlying image has rendered an actor before screenshotting the SR
  // overlay (line/rectangle).
  await waitForViewportsRendered(page);
  await page.waitForTimeout(2000);
  await waitForPaintToSettle(page);
  const activeViewport = await viewportPageObject.active;

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.srHydration.srPreHydration,
  });

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
  await page.waitForTimeout(2000);

  // Hydration should produce exactly the SR's two labeled measurements.
  // ("Max: NaN" is the current UI output for the second row's missing stat;
  // if that is ever fixed this assertion will surface it.)
  await expect(rightPanelPageObject.measurementsPanel.panel.rows).toHaveCount(2);
  const firstRow = rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0);
  await expect(firstRow.title).toHaveText('Label1');
  await expect(firstRow.stats.primary.lines).toHaveText(['46.6 mm']);
  const secondRow = rightPanelPageObject.measurementsPanel.panel.nthMeasurement(1);
  await expect(secondRow.title).toHaveText('Label2');
  await expect(secondRow.stats.primary.lines).toHaveText(['1064', 'Max: NaN']);
  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.srHydration.srPostHydration,
  });

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
      viewport.scroll(20);
      viewport.render();
    }
  });

  await rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0).click();

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.srHydration.srJumpToMeasurement,
  });
});
