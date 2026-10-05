import {
  checkForViewportScreenshot,
  expect,
  expectAnnotationStatsText,
  measurementTextFormatters,
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

  // Hydration should produce the SR's two measurements; the first one is the
  // measurement shown in the screenshot below.
  await expect(rightPanelPageObject.measurementsPanel.panel.rows).toHaveCount(2);
  await expect(rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0).title).toHaveText(
    'Label1'
  );

  const expectedLength = '46.6';

  await expectAnnotationStatsText({
    page,
    activeViewport,
    rightPanelPageObject,
    toolName: 'Length',
    expectedPanelPrimaryLines: [measurementTextFormatters.lengthLine(expectedLength)],
    expectedSvgLines: [measurementTextFormatters.lengthLine(expectedLength)],
    assertStats: stats => {
      expect(stats.unit).toBe('mm');
      expect((stats.length as number).toFixed(1)).toBe(expectedLength);
    },
  });
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
