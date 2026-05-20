import type { Locator } from '@playwright/test';

import {
  checkForScreenshot,
  expect,
  getAnnotationStats,
  screenShotPaths,
  test,
  visitStudy,
} from './utils';

async function expectNonEmptyDetailLines(lines: Locator) {
  const lineCount = await lines.count();
  expect(lineCount).toBeGreaterThan(0);
  for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
    await expect(lines.nth(lineIndex)).not.toBeEmpty();
  }
}

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.2.840.113654.2.55.242841386983064378162007136685545369722';
  const mode = 'viewer';

  await visitStudy(page, studyInstanceUID, mode, 5000);

  // Log the actual URL that was loaded
  const currentUrl = page.url();
  console.log(`✅ Actual page URL: ${currentUrl}\n`);

  // Remove any webpack dev server overlays that might be blocking interactions
  await page.evaluate(() => {
    const overlay = document.getElementById('webpack-dev-server-client-overlay');
    if (overlay) {
      overlay.remove();
    }
  });
});

//
test('should hydrate SCOORD rectangle measurements correctly', async ({
  page,
  DOMOverlayPageObject,
  leftPanelPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  // Wait for the side panel to be visible and clickable
  await page.waitForTimeout(3000);

  // Navigate to the tracked measurements panel
  await rightPanelPageObject.toggle();
  await rightPanelPageObject.measurementsPanel.select();

  // Double-click on the study browser thumbnail to load the SR
  await leftPanelPageObject.loadSeriesByModality('SR');
  await page.waitForTimeout(2000);

  // Wait for the SR to load and stabilize before taking screenshot
  await page.waitForTimeout(1000);

  const activeViewport = await viewportPageObject.active;

  // Take screenshot before hydration - use viewport locator instead of full page
  await checkForScreenshot(
    page,
    activeViewport.pane,
    screenShotPaths.scoordRectangle.scoordRectanglePreHydration
  );

  // Zoom in to better see the measurements
  await page.evaluate(() => {
    // Access cornerstone directly from the window object
    const cornerstone = (window as any).cornerstone;
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

  // Wait for rendering to complete
  await page.waitForTimeout(1000);

  // Wait for the hydrate button to be visible and clickable
  await DOMOverlayPageObject.viewport.segmentationHydration.yes.button.waitFor({
    state: 'visible',
    timeout: 15000,
  });

  // Click the hydrate button to load the SCOORD rectangle measurements
  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();

  // Wait for hydration to complete and rendering to stabilize
  await page.waitForTimeout(3000);

  // Take screenshot after hydration showing the rectangle measurements - use viewport locator
  await checkForScreenshot(
    page,
    activeViewport.pane,
    screenShotPaths.scoordRectangle.scoordRectanglePostHydration
  );

  // Verify the measurements list has the correct rectangle measurements
  const rowCount = await rightPanelPageObject.measurementsPanel.panel.getMeasurementCount();
  expect(rowCount).toBeGreaterThan(0);

  for (let i = 0; i < rowCount; i++) {
    const measurement = rightPanelPageObject.measurementsPanel.panel.nthMeasurement(i);
    await expect(measurement.title).not.toBeEmpty();
    await expectNonEmptyDetailLines(measurement.stats.primary.lines);
    await expectNonEmptyDetailLines(measurement.stats.secondary.lines);
  }

  // Test jumping to a specific measurement by scrolling and clicking
  await page.evaluate(() => {
    // Access cornerstone directly from the window object
    const cornerstone = (window as any).cornerstone;
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

  // Click on a data row to jump to the measurement
  await rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0).click();

  // Take screenshot showing the jump to measurement functionality - use viewport locator
  await checkForScreenshot(
    page,
    activeViewport.pane,
    screenShotPaths.scoordRectangle.scoordRectangleJumpToMeasurement
  );
});

test('should display SCOORD rectangle measurements correctly', async ({
  page,
  DOMOverlayPageObject,
  leftPanelPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  // Wait for the side panel to be visible and clickable
  await page.waitForTimeout(3000);

  // First hydrate the SR to load the measurements
  await rightPanelPageObject.toggle();
  await rightPanelPageObject.measurementsPanel.select();
  await leftPanelPageObject.loadSeriesByModality('SR');
  await page.waitForTimeout(2000);

  // Wait for the hydrate button to be visible and clickable
  await DOMOverlayPageObject.viewport.segmentationHydration.yes.button.waitFor({
    state: 'visible',
    timeout: 15000,
  });
  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();
  await page.waitForTimeout(2000);

  // Zoom to show the rectangle measurements clearly
  await page.evaluate(() => {
    const cornerstone = (window as any).cornerstone;
    if (!cornerstone) {
      return;
    }

    const enabledElements = cornerstone.getEnabledElements();
    if (enabledElements.length === 0) {
      return;
    }

    const viewport = enabledElements[0].viewport;
    if (viewport) {
      viewport.setZoom(3);
      viewport.render();
    }
  });

  // Wait for rendering to complete before taking screenshot
  await page.waitForTimeout(2000);

  const activeViewport = await viewportPageObject.active;

  // Take screenshot showing the SCOORD rectangle measurements rendered correctly - use viewport locator
  await checkForScreenshot(
    page,
    activeViewport.pane,
    screenShotPaths.scoordRectangle.scoordRectangleDisplayedCorrectly
  );

  // Verify the measurements list has the correct rectangle measurements and not others
  const rowCount = await rightPanelPageObject.measurementsPanel.panel.getMeasurementCount();
  expect(rowCount).toBeGreaterThan(0);

  const firstMeasurement = rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0);
  const expectedFirstPrimaryDetailLines = ['276 mm²', 'Max: 598 HU', 'Lung structure'];
  await expect(firstMeasurement.stats.primary.lines).toHaveCount(
    expectedFirstPrimaryDetailLines.length
  );
  for (let lineIndex = 0; lineIndex < expectedFirstPrimaryDetailLines.length; lineIndex++) {
    await expect(firstMeasurement.stats.primary.lines.nth(lineIndex)).toHaveText(
      expectedFirstPrimaryDetailLines[lineIndex]
    );
  }

  // Assert against the source-of-truth cachedStats on the cornerstone annotation,
  // independent of UI label formatting. Values should match the displayed labels
  // after rounding ("276 mm²", "Max: 598 HU").
  const rectangles = await getAnnotationStats(page, { toolName: 'RectangleROI' });
  expect(rectangles.length).toBeGreaterThan(0);

  const stats = rectangles[0].firstTargetStats!;
  expect(stats.areaUnit).toBe('mm²');
  expect(Math.round(stats.area as number)).toBe(276);
  expect(Math.round(stats.max as number)).toBe(598);
  expect(stats.Modality).toBe('CT');
  expect(stats.modalityUnit).toBe('HU');

  const lines = activeViewport.getSvgAnnotationStatTextLines(rectangles[0].annotationUID);
  await expect(lines).toHaveCount(5);
  await expect(lines.nth(0)).toHaveText('Area: 276 mm²');

  for (let i = 0; i < rowCount; i++) {
    const measurement = rightPanelPageObject.measurementsPanel.panel.nthMeasurement(i);
    await expect(measurement.title).not.toBeEmpty();
    await expectNonEmptyDetailLines(measurement.stats.primary.lines);
    await expectNonEmptyDetailLines(measurement.stats.secondary.lines);
  }
});
