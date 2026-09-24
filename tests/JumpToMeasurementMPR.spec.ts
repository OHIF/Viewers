import {
  checkForGridScreenshot,
  checkForViewportScreenshot,
  expect,
  screenShotPaths,
  test,
  visitStudy,
  waitForPaintToSettle,
  waitForViewportRenderCycle,
} from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 5000);
});

test('should hydrate in MPR correctly', async ({
  page,
  DOMOverlayPageObject,
  leftPanelPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await rightPanelPageObject.toggle();
  await rightPanelPageObject.measurementsPanel.select();

  await leftPanelPageObject.loadSeriesByDescription('Body 4.0 CE', 1);

  await page.waitForTimeout(5000);

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
      viewport.setImageIdIndex(20);
      viewport.render();
    }
  });

  await page.waitForTimeout(5000);

  await mainToolbarPageObject.measurementTools.bidirectional.click();
  const activeViewport = await viewportPageObject.active;
  await activeViewport.clickAt([
    { x: 405, y: 277 },
    { x: 515, y: 339 },
  ]);

  await page.waitForTimeout(2000);

  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();

  // The jumps below target this single tracked bidirectional; pin its panel
  // entry so a failed draw is caught here rather than as a pixel diff.
  await expect(rightPanelPageObject.measurementsPanel.panel.rows).toHaveCount(1);
  const drawnRow = rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0);
  await expect(drawnRow.stats.primary.lines).toHaveText(['L: 76.3 mm', 'W: 50.8 mm']);

  // scroll away
  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.jumpToMeasurementMPR.initialDraw,
  });

  // Focus on the canvas first, then use mouse wheel to scroll away
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
      viewport.setImageIdIndex(0);
      viewport.render();
    }
  });

  await page.waitForTimeout(5000);

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.jumpToMeasurementMPR.scrollAway,
  });

  await rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0).click();

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.jumpToMeasurementMPR.jumpToMeasurementStack,
  });

  await mainToolbarPageObject.layoutSelection.MPR.click();

  await page.waitForTimeout(5000);

  // jump in viewport again
  await rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0).click();

  await page.waitForTimeout(3000);

  await checkForGridScreenshot({
    page,
    viewportPageObject,
    screenshotPath: screenShotPaths.jumpToMeasurementMPR.jumpInMPR,
  });

  const seriesChangeRenderCycle = waitForViewportRenderCycle(page, { renderedTimeout: 30000 });

  await leftPanelPageObject.loadSeriesByDescription('Lung 3.0 CE');

  await seriesChangeRenderCycle;
  // Series change unloads the old volume and progressively streams the new
  // one; the wait helper resolves when loadStatus.loaded flips true, but the
  // MPR mappers can still be sampling stale low-res frames for one tick.
  // Give the streaming tail a chance to upload before screenshotting.
  await page.waitForTimeout(2000);
  await waitForPaintToSettle(page);

  await checkForGridScreenshot({
    page,
    viewportPageObject,
    screenshotPath: screenShotPaths.jumpToMeasurementMPR.changeSeriesInMPR,
  });

  await rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0).click();

  await checkForGridScreenshot({
    page,
    viewportPageObject,
    screenshotPath: screenShotPaths.jumpToMeasurementMPR.jumpToMeasurementAfterSeriesChange,
  });
});
