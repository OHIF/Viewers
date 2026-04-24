import { Page } from 'playwright-test-coverage';
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
 * These two studies load heavy 3D viewports. Use this single spec (serial) instead
 * of two files with multiple workers, or the dev server on :3335 can be overloaded
 * (flaky baselines, ERR_CONNECTION_REFUSED on visitStudy).
 */
test.describe('SCOORD image measurement screenshots', () => {
  test.describe.configure({ mode: 'serial' });

  const probeStudyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.7310.5101.860473186348887719777907797922';

  test.describe('SCORD3D probe', () => {
    test.beforeEach(async ({ page }) => {
      await visitStudy(page, probeStudyInstanceUID, 'viewer', 5000);
      console.log(`✅ Actual page URL: ${page.url()}\n`);
      await removeDevServerOverlay(page);
    });

    test('should hydrate SCOORD3D probe measurements correctly', async ({
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
      // Re-open MR so the active viewport is the 3D volume, not the SR document.
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
        screenShotPaths.scoord3dProbe.scoord3dProbePreHydration
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
        screenShotPaths.scoord3dProbe.scoord3dProbePostHydration
      );

      const measurementRows = page.getByTestId('data-row');
      const rowCount = await measurementRows.count();
      expect(
        await rightPanelPageObject.measurementsPanel.panel.getMeasurementCount()
      ).toBeGreaterThan(0);

      for (let i = 0; i < rowCount; i++) {
        const measurementText = await rightPanelPageObject.measurementsPanel.panel
          .nthMeasurement(i)
          .locator.textContent();
        expect(measurementText).toBeTruthy();
      }

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
          viewport.scroll(20);
          viewport.render();
        }
      });

      await rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0).click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      // Scroll + jump has slightly more frame-to-frame pixel variance
      await checkForScreenshot({
        page,
        locator: activeViewport.pane,
        screenshotPath: screenShotPaths.scoord3dProbe.scoord3dProbeJumpToMeasurement,
        maxDiffPixelRatio: 0.06,
      });
    });

    test('should display SCOORD3D probe measurements correctly', async ({
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
      await page.waitForTimeout(1000);

      await expect
        .poll(
          () => rightPanelPageObject.measurementsPanel.panel.getMeasurementCount(),
          { timeout: 60_000 }
        )
        .toBeGreaterThan(0);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const activeViewport = await viewportPageObject.active;

      await rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0).click();
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
      await page.waitForTimeout(2000);

      await checkForScreenshot(
        page,
        activeViewport.pane,
        screenShotPaths.scoord3dProbe.scoord3dProbeDisplayedCorrectly
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
          viewport.scroll(20);
          viewport.render();
        }
      });

      await rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0).click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await checkForScreenshot({
        page,
        locator: activeViewport.pane,
        screenshotPath: screenShotPaths.scoordRectangle.scoordRectangleJumpToMeasurement,
        maxDiffPixelRatio: 0.06,
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
