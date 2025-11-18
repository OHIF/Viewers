import { test } from 'playwright-test-coverage';
import { visitStudy, checkForScreenshot, screenShotPaths } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.7310.5101.860473186348887719777907797922';
  const mode = 'viewer';
  
  await visitStudy(page, studyInstanceUID, mode, 5000, 'ohif');
  
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

test('should hydrate SCOORD3D probe measurements correctly', async ({ page }) => {
  // Wait for the side panel to be visible and clickable
  await page.waitForTimeout(3000);
  
  // Navigate to the tracked measurements panel
  await page.getByTestId('side-panel-header-right').click({ timeout: 15000 });
  await page.getByTestId('trackedMeasurements-btn').click();
  
  // Double-click on the study browser thumbnail to load the SR
  await page.getByTestId('study-browser-thumbnail-no-image').dblclick();
  await page.waitForTimeout(2000);
  
  // Wait for the SR to load and stabilize before taking screenshot
  await page.waitForTimeout(1000);
  
  // Take screenshot before hydration
  await checkForScreenshot(page, page, screenShotPaths.scoord3dProbe.scoord3dProbePreHydration);

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
  await page.getByTestId('yes-hydrate-btn').waitFor({ state: 'visible', timeout: 15000 });
  
  // Click the hydrate button to load the SCOORD3D probe measurements
  await page.getByTestId('yes-hydrate-btn').click();
  
  // Wait for hydration to complete and rendering to stabilize
  await page.waitForTimeout(3000);
  
  // Take screenshot after hydration showing the probe measurements
  await checkForScreenshot(page, page, screenShotPaths.scoord3dProbe.scoord3dProbePostHydration);

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
  await page.getByTestId('data-row').first().click();

  // Take screenshot showing the jump to measurement functionality
  await checkForScreenshot(page, page, screenShotPaths.scoord3dProbe.scoord3dProbeJumpToMeasurement);
});

test('should display SCOORD3D probe measurements correctly', async ({ page }) => {
  // Wait for the side panel to be visible and clickable
  await page.waitForTimeout(3000);
  
  // First hydrate the SR to load the measurements
  await page.getByTestId('side-panel-header-right').click({ timeout: 15000 });
  await page.getByTestId('trackedMeasurements-btn').click();
  await page.getByTestId('study-browser-thumbnail-no-image').dblclick();
  await page.waitForTimeout(2000);
  
  // Wait for the hydrate button to be visible and clickable
  await page.getByTestId('yes-hydrate-btn').waitFor({ state: 'visible', timeout: 15000 });
  await page.getByTestId('yes-hydrate-btn').click();
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

  // Take screenshot showing the SCOORD3D probe measurements rendered correctly
  await checkForScreenshot(page, page, screenShotPaths.scoord3dProbe.scoord3dProbeDisplayedCorrectly);
});
