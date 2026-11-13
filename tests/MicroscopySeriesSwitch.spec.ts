import { Page } from '@playwright/test';
import { test, expect, visitStudy } from './utils';

// A whole slide imaging study with three SM series, each a separate slide.
const studyInstanceUID = '2.25.141277760791347900862109212450152067508';

test.beforeEach(async ({ page }) => {
  await visitStudy(page, studyInstanceUID, 'microscopy', 5000);
});

/** Number of ROIs in each microscopy viewer, in ascending order. */
async function getViewerRoiCounts(page: Page) {
  return page.evaluate(() =>
    Array.from((window as any).services.microscopyService.managedViewers)
      .map((managedViewer: any) => managedViewer.viewer.getAllROIs().length)
      .sort((a, b) => a - b)
  );
}

/** Display set UIDs of the slide in the active viewport and of another slide. */
async function getSlideDisplaySetUIDs(page: Page) {
  return page.evaluate(() => {
    const { viewportGridService, displaySetService } = (window as any).services;
    const { activeViewportId, viewports } = viewportGridService.getState();
    const shown = viewports.get(activeViewportId).displaySetInstanceUIDs[0];
    const other = displaySetService
      .getActiveDisplaySets()
      .find(
        displaySet => displaySet.Modality === 'SM' && displaySet.displaySetInstanceUID !== shown
      );
    return { shown, other: other.displaySetInstanceUID };
  });
}

test('should keep a measurement after switching to another series and back', async ({
  page,
  mainToolbarPageObject,
  viewportPageObject,
  leftPanelPageObject,
  rightPanelPageObject,
}) => {
  // Draw only once the microscopy viewer exists; the fixed delay in visitStudy
  // is not enough when the slide loads slowly.
  await expect.poll(() => getViewerRoiCounts(page), { timeout: 30_000 }).toEqual([0]);
  await mainToolbarPageObject.measurementTools.line.click();
  const activeViewport = await viewportPageObject.active;
  await activeViewport.clickAt([{ x: 400, y: 200 }]);
  await page.waitForTimeout(200);
  await activeViewport.clickAt([{ x: 550, y: 250 }]);

  const measurementRow = rightPanelPageObject.microscopyPanel.nthMeasurement(0);
  await expect(measurementRow.locator).toBeVisible();
  await expect.poll(() => getViewerRoiCounts(page)).toEqual([1]);

  const { shown, other } = await getSlideDisplaySetUIDs(page);
  await leftPanelPageObject.toggle();
  await page.locator(`[id="thumbnail-${other}"]`).dblclick();

  // The measurement belongs to the other slide, so neither the panel nor the
  // viewer shows it here.
  await expect(page.getByTestId('data-row')).toHaveCount(0);
  await expect.poll(() => getViewerRoiCounts(page)).toEqual([0]);

  await page.locator(`[id="thumbnail-${shown}"]`).dblclick();

  await expect(measurementRow.locator).toBeVisible();
  await expect.poll(() => getViewerRoiCounts(page)).toEqual([1]);
});

test('should keep a measurement when another series loads in a second viewport', async ({
  page,
  mainToolbarPageObject,
  viewportPageObject,
  rightPanelPageObject,
}) => {
  // Draw only once the microscopy viewer exists; the fixed delay in visitStudy
  // is not enough when the slide loads slowly.
  await expect.poll(() => getViewerRoiCounts(page), { timeout: 30_000 }).toEqual([0]);
  await mainToolbarPageObject.measurementTools.line.click();
  const activeViewport = await viewportPageObject.active;
  await activeViewport.clickAt([{ x: 400, y: 200 }]);
  await page.waitForTimeout(200);
  await activeViewport.clickAt([{ x: 550, y: 250 }]);

  const measurementRow = rightPanelPageObject.microscopyPanel.nthMeasurement(0);
  await expect(measurementRow.locator).toBeVisible();

  // The hanging protocol fills the new viewport with another slide; the first
  // viewport keeps its slide and its measurement.
  await page.evaluate(() =>
    (window as any).commandsManager.runCommand('setViewportGridLayout', {
      numRows: 1,
      numCols: 2,
    })
  );

  await expect.poll(() => getViewerRoiCounts(page)).toEqual([0, 1]);
  await expect(measurementRow.locator).toBeVisible();
});
