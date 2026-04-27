import { Locator, Page } from 'playwright-test-coverage';
import { checkForScreenshot, expect, screenShotPaths, test, visitStudy } from './utils';

const removeDevServerOverlay = (page: Page) =>
  page.evaluate(() => {
    const overlay = document.getElementById('webpack-dev-server-client-overlay');
    if (overlay) {
      overlay.remove();
    }
  });

/**
 * ViewportDialog uses document-level mousedown; double-clicking a study
 * thumbnail to refocus the source series counts as "outside" the dialog and
 * cancels the SR hydrate prompt, so the Yes button never appears.
 * Always confirm (Yes) right after the SR is opened, before dblclicking CT/MR.
 */
async function waitAndClickStructuredReportHydration(page: Page) {
  const yes = page.getByTestId('yes-hydrate-btn');
  await yes.waitFor({ state: 'visible', timeout: 60_000 });
  await yes.click();
}

/**
 * Stack viewports show a "Loading..." overlay (ViewportImageSliceLoadingIndicator) after
 * scroll/jump until the target slice is decoded. Wait for it to clear before screenshots.
 *
 * Important: the overlay is mounted on a 50ms delay, so a check that "Loading..." is
 * missing must not pass until either we have seen it appear (then clear) or a grace
 * period elapses (cached slice, overlay never shows).
 */
async function waitForStackSliceLoadingCleared(page: Page, viewportPane: Locator) {
  const loading = viewportPane.getByText('Loading...', { exact: true }).first();
  const start = Date.now();
  const maxMs = 60_000;
  const noOverlayGraceMs = 2500;
  let sawLoadingVisible = false;
  while (Date.now() - start < maxMs) {
    const n = await loading.count();
    const visible = n > 0 && (await loading.isVisible().catch(() => false));
    if (visible) {
      sawLoadingVisible = true;
    }
    if (!visible) {
      if (sawLoadingVisible) {
        await page.waitForTimeout(200);
        return;
      }
      if (Date.now() - start >= noOverlayGraceMs) {
        return;
      }
    }
    await page.waitForTimeout(100);
  }
  throw new Error('Timeout waiting for stack slice "Loading..." overlay to clear');
}

/**
 * These two studies load heavy 3D viewports. Use this single spec (serial) instead
 * of two files with multiple workers, or the dev server on :3335 can be overloaded
 * (flaky baselines, ERR_CONNECTION_REFUSED on visitStudy).
 */
test.describe('SCOORD image measurement screenshots', () => {
  test.describe.configure({ mode: 'serial' });

  const pointStudyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.7310.5101.860473186348887719777907797922';

  test.describe('SCORD3D point', () => {
    test.beforeEach(async ({ page }) => {
      await visitStudy(page, pointStudyInstanceUID, 'viewer', 5000);
      console.log(`✅ Actual page URL: ${page.url()}\n`);
      await removeDevServerOverlay(page);
    });

    test('should hydrate SCOORD3D point measurements correctly', async ({
      page,
      leftPanelPageObject,
      rightPanelPageObject,
      viewportPageObject,
    }) => {
      await page.waitForTimeout(3000);
      await rightPanelPageObject.toggle();
      await rightPanelPageObject.measurementsPanel.select();

      // DICOM SCOORD3D references series 3 (t2_tse_sag); then SR (series 100)
      await leftPanelPageObject.loadSeriesByModalityAndSeriesNumber('MR', 3);
      await page.waitForTimeout(2000);
      await leftPanelPageObject.loadSeriesByModalityAndSeriesNumber('SR', 100);
      await page.waitForTimeout(2000);
      await waitAndClickStructuredReportHydration(page);
      await leftPanelPageObject.loadSeriesByModalityAndSeriesNumber('MR', 3);
      await page.waitForTimeout(2000);
      await page
        .locator('[data-cy="viewport-pane"] canvas')
        .first()
        .waitFor({ state: 'visible', timeout: 60_000 });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const activeViewport = await viewportPageObject.active;

      await checkForScreenshot(
        page,
        activeViewport.pane,
        screenShotPaths.scoord3dPoint.scoord3dPointPreHydration
      );

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
          viewport.setZoom(4);
          viewport.render();
        }
      });
      await page.waitForTimeout(1000);

      await expect
        .poll(
          () => rightPanelPageObject.measurementsPanel.panel.getMeasurementCount(),
          { timeout: 60_000 }
        )
        .toBeGreaterThan(0);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(4000);

      await checkForScreenshot(
        page,
        activeViewport.pane,
        screenShotPaths.scoord3dPoint.scoord3dPointPostHydration
      );

      const rowCount = await rightPanelPageObject.measurementsPanel.panel.getMeasurementCount();
      expect(rowCount).toBeGreaterThan(0);
      for (let i = 0; i < rowCount; i++) {
        const measurementText = await rightPanelPageObject.measurementsPanel.panel
          .nthMeasurement(i)
          .locator.textContent();
        expect(measurementText).toBeTruthy();
      }

      await rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0).click();
      const activeAfterJump = await viewportPageObject.active;
      await waitForStackSliceLoadingCleared(page, activeAfterJump.pane);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(4000);
      await checkForScreenshot({
        page,
        locator: activeAfterJump.pane,
        screenshotPath: screenShotPaths.scoord3dPoint.scoord3dPointJumpToMeasurement,
        maxDiffPixelRatio: 0.1,
        attempts: 15,
        delay: 2000,
      });
    });

    test('should display SCOORD3D point measurements correctly', async ({
      page,
      leftPanelPageObject,
      rightPanelPageObject,
      viewportPageObject,
    }) => {
      await page.waitForTimeout(3000);
      await rightPanelPageObject.toggle();
      await rightPanelPageObject.measurementsPanel.select();
      await leftPanelPageObject.loadSeriesByModalityAndSeriesNumber('MR', 3);
      await page.waitForTimeout(2000);
      await leftPanelPageObject.loadSeriesByModalityAndSeriesNumber('SR', 100);
      await page.waitForTimeout(2000);
      await waitAndClickStructuredReportHydration(page);
      await leftPanelPageObject.loadSeriesByModalityAndSeriesNumber('MR', 3);
      await page.waitForTimeout(2000);
      await page
        .locator('[data-cy="viewport-pane"] canvas')
        .first()
        .waitFor({ state: 'visible', timeout: 60_000 });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await expect
        .poll(
          () => rightPanelPageObject.measurementsPanel.panel.getMeasurementCount(),
          { timeout: 60_000 }
        )
        .toBeGreaterThan(0);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

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
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(8000);
      const activeViewport = await viewportPageObject.active;

      await checkForScreenshot(
        page,
        activeViewport.pane,
        screenShotPaths.scoord3dPoint.scoord3dPointDisplayedCorrectly
      );

      const rowCount = await rightPanelPageObject.measurementsPanel.panel.getMeasurementCount();
      expect(rowCount).toBeGreaterThan(0);
      for (let i = 0; i < rowCount; i++) {
        const measurementText = await rightPanelPageObject.measurementsPanel.panel
          .nthMeasurement(i)
          .locator.textContent();
        expect(measurementText).toBeTruthy();
      }
    });
  });

  const rectangleStudyInstanceUID =
    '1.2.840.113654.2.55.242841386983064378162007136685545369722';

  test.describe('SCORD rectangle', () => {
    test.beforeEach(async ({ page }) => {
      await visitStudy(page, rectangleStudyInstanceUID, 'viewer', 5000);
      console.log(`✅ Actual page URL: ${page.url()}\n`);
      await removeDevServerOverlay(page);
    });

    test('should hydrate SCOORD rectangle measurements correctly', async ({
      page,
      leftPanelPageObject,
      rightPanelPageObject,
      viewportPageObject,
    }) => {
      await page.waitForTimeout(3000);
      await rightPanelPageObject.toggle();
      await rightPanelPageObject.measurementsPanel.select();

      // SR references CT (series 3) then the SR (series 103)
      await leftPanelPageObject.loadSeriesByModalityAndSeriesNumber('CT', 3);
      await page.waitForTimeout(2000);
      await leftPanelPageObject.loadSeriesByModalityAndSeriesNumber('SR', 103);
      await page.waitForTimeout(2000);
      await waitAndClickStructuredReportHydration(page);
      await leftPanelPageObject.loadSeriesByModalityAndSeriesNumber('CT', 3);
      await page.waitForTimeout(2000);
      // Ensure the source stack and SR are rendered before the pre-hydration shot
      await page
        .locator('[data-cy="viewport-pane"] canvas')
        .first()
        .waitFor({ state: 'visible', timeout: 60_000 });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const activeViewport = await viewportPageObject.active;

      await checkForScreenshot(
        page,
        activeViewport.pane,
        screenShotPaths.scoordRectangle.scoordRectanglePreHydration
      );

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
          viewport.setZoom(4);
          viewport.render();
        }
      });
      await page.waitForTimeout(1000);

      await expect
        .poll(
          () => rightPanelPageObject.measurementsPanel.panel.getMeasurementCount(),
          { timeout: 60_000 }
        )
        .toBeGreaterThan(0);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(4000);

      await checkForScreenshot(
        page,
        activeViewport.pane,
        screenShotPaths.scoordRectangle.scoordRectanglePostHydration
      );

      const rowCount = await rightPanelPageObject.measurementsPanel.panel.getMeasurementCount();
      expect(rowCount).toBeGreaterThan(0);
      for (let i = 0; i < rowCount; i++) {
        const measurementText = await rightPanelPageObject.measurementsPanel.panel
          .nthMeasurement(i)
          .locator.textContent();
        expect(measurementText).toBeTruthy();
      }

      // Do not `scroll(20)` here: for this stack+hydration state it often left the
      // viewer on a slice (e.g. 40) that did not match a subsequent jump target,
      // so instance overlays, pixels, and baselines disagreed (pass/fail at random).
      await rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0).click();
      const activeAfterJump = await viewportPageObject.active;
      await waitForStackSliceLoadingCleared(page, activeAfterJump.pane);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(4000);
      await checkForScreenshot({
        page,
        locator: activeAfterJump.pane,
        screenshotPath: screenShotPaths.scoordRectangle.scoordRectangleJumpToMeasurement,
        maxDiffPixelRatio: 0.1,
        attempts: 15,
        delay: 2000,
      });
    });

    test('should display SCOORD rectangle measurements correctly', async ({
      page,
      leftPanelPageObject,
      rightPanelPageObject,
      viewportPageObject,
    }) => {
      await page.waitForTimeout(3000);
      await rightPanelPageObject.toggle();
      await rightPanelPageObject.measurementsPanel.select();
      await leftPanelPageObject.loadSeriesByModalityAndSeriesNumber('CT', 3);
      await page.waitForTimeout(2000);
      await leftPanelPageObject.loadSeriesByModalityAndSeriesNumber('SR', 103);
      await page.waitForTimeout(2000);
      await waitAndClickStructuredReportHydration(page);
      await leftPanelPageObject.loadSeriesByModalityAndSeriesNumber('CT', 3);
      await page.waitForTimeout(2000);
      await page
        .locator('[data-cy="viewport-pane"] canvas')
        .first()
        .waitFor({ state: 'visible', timeout: 60_000 });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await expect
        .poll(
          () => rightPanelPageObject.measurementsPanel.panel.getMeasurementCount(),
          { timeout: 60_000 }
        )
        .toBeGreaterThan(0);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

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
      await page.waitForLoadState('networkidle');
      // Volume + annotation compositing is slow on a cold data fetch; a fixed
      // settle helps match baselines between runs and across machines.
      await page.waitForTimeout(8000);
      const activeViewport = await viewportPageObject.active;

      await checkForScreenshot(
        page,
        activeViewport.pane,
        screenShotPaths.scoordRectangle.scoordRectangleDisplayedCorrectly
      );

      const rowCount = await rightPanelPageObject.measurementsPanel.panel.getMeasurementCount();
      expect(rowCount).toBeGreaterThan(0);
      for (let i = 0; i < rowCount; i++) {
        const measurementText = await rightPanelPageObject.measurementsPanel.panel
          .nthMeasurement(i)
          .locator.textContent();
        expect(measurementText).toBeTruthy();
      }
    });
  });
});
