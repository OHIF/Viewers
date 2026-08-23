import { test, visitStudy, expect } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.2.276.0.7230010.3.1.2.296485376.1.1665793212.499772';
  const mode = 'microscopy';
  await visitStudy(page, studyInstanceUID, mode, 5000);
});
test('should rename a microscopy measurement label', async ({
  page,
  mainToolbarPageObject,
  DOMOverlayPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const newLabel = 'Renamed Measurement';

  await mainToolbarPageObject.measurementTools.line.click();

  const activeViewport = await viewportPageObject.active;
  await activeViewport.clickAt([{ x: 400, y: 200 }]);
  await page.waitForTimeout(200);
  await activeViewport.clickAt([{ x: 550, y: 250 }]);

  const measurementRow = rightPanelPageObject.microscopyPanel.nthMeasurement(0);
  await expect(measurementRow.locator).toBeVisible();

  await expect(measurementRow.title).toHaveText('(empty)');

  await measurementRow.actions.rename(newLabel);

  await expect(DOMOverlayPageObject.dialog.input.locator).toBeHidden();

  await expect(measurementRow.title).toHaveText(newLabel);
});
