import {
  screenShotPaths,
  test,
  visitStudyRendered,
  waitForViewportGridCornerstoneRendered,
} from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  await visitStudyRendered(page, studyInstanceUID);
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
  await viewportPageObject.active.clickAt([
    { x: 405, y: 277 },
    { x: 515, y: 339 },
  ]);

  await page.waitForTimeout(2000);

  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();

  // scroll away
  await viewportPageObject.checkForScreenshot(screenShotPaths.jumpToMeasurementMPR.initialDraw);

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

  await waitForViewportGridCornerstoneRendered(page);

  await viewportPageObject.checkForScreenshot(screenShotPaths.jumpToMeasurementMPR.scrollAway);

  await rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0).click();

  await viewportPageObject.checkForScreenshot(
    screenShotPaths.jumpToMeasurementMPR.jumpToMeasurementStack
  );

  await mainToolbarPageObject.layoutSelection.MPR.click();

  await waitForViewportGridCornerstoneRendered(page);

  // jump in viewport again
  await rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0).click();

  await waitForViewportGridCornerstoneRendered(page);

  await viewportPageObject.checkForScreenshot(screenShotPaths.jumpToMeasurementMPR.jumpInMPR);

  await leftPanelPageObject.loadSeriesByDescription('Lung 3.0 CE');
  await waitForViewportGridCornerstoneRendered(page);

  await viewportPageObject.checkForScreenshot(
    screenShotPaths.jumpToMeasurementMPR.changeSeriesInMPR
  );

  await rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0).click();

  await viewportPageObject.checkForScreenshot(
    screenShotPaths.jumpToMeasurementMPR.jumpToMeasurementAfterSeriesChange
  );
});
