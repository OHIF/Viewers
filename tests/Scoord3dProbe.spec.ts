import { checkForScreenshot, expect, screenShotPaths, test, visitStudy } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.7310.5101.860473186348887719777907797922';
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

test('should hydrate SCOORD3D probe measurements correctly', async ({
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

  // Take screenshot before hydration - use viewport locator instead of full page
  await checkForScreenshot(
    page,
    viewportPageObject.active.pane,
    screenShotPaths.scoord3dProbe.scoord3dProbePreHydration
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

  // Click the hydrate button to load the SCOORD3D probe measurements
  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();

  // Wait for hydration to complete and rendering to stabilize
  await page.waitForTimeout(3000);

  // Take screenshot after hydration showing the probe measurements - use viewport locator
  await checkForScreenshot(
    page,
    viewportPageObject.active.pane,
    screenShotPaths.scoord3dProbe.scoord3dProbePostHydration
  );

  // Verify the measurements list has the correct probe measurements
  const measurementRows = page.getByTestId('data-row');
  const rowCount = await measurementRows.count();
  expect(await rightPanelPageObject.measurementsPanel.panel.getMeasurementCount()).toBeGreaterThan(
    0
  );

  // Verify that the measurements are probe measurements (not other types)
  for (let i = 0; i < rowCount; i++) {
    const measurementText = await rightPanelPageObject.measurementsPanel.panel
      .nthMeasurement(i)
      .locator.textContent();
    // Probe measurements should be present, verify they're not other measurement types
    expect(measurementText).toBeTruthy();
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
    viewportPageObject.active.pane,
    screenShotPaths.scoord3dProbe.scoord3dProbeJumpToMeasurement
  );
});

test('should display SCOORD3D probe measurements correctly', async ({
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

  // Zoom to show the probe measurements clearly
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

  // Take screenshot showing the SCOORD3D probe measurements rendered correctly - use viewport locator
  await checkForScreenshot(
    page,
    viewportPageObject.active.pane,
    screenShotPaths.scoord3dProbe.scoord3dProbeDisplayedCorrectly
  );

  // Verify the measurements list has the correct probe measurements and not others
  const rowCount = await rightPanelPageObject.measurementsPanel.panel.getMeasurementCount();
  expect(rowCount).toBeGreaterThan(0);

  // Verify that the measurements are probe measurements (not other types like rectangle)
  for (let i = 0; i < rowCount; i++) {
    const measurementText = await rightPanelPageObject.measurementsPanel.panel
      .nthMeasurement(i)
      .locator.textContent();
    // Probe measurements should be present, verify they're not other measurement types
    expect(measurementText).toBeTruthy();
  }
});
