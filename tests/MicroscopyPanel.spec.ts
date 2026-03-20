import { test, visitStudy, expect } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.2.276.0.7230010.3.1.2.296485376.1.1665793212.499772';
  await visitStudy(page, studyInstanceUID, {
    mode: 'microscopy',
    settleMs: 5000,
    skipCornerstoneRenderedWait: true,
  });
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

  await viewportPageObject.active.clickAt([{ x: 400, y: 200 }]);
  await page.waitForTimeout(200);
  await viewportPageObject.active.clickAt([{ x: 550, y: 250 }]);

  const measurementRow = rightPanelPageObject.microscopyPanel.nthMeasurement(0);
  await expect(measurementRow.locator).toBeVisible();

  await expect(measurementRow.title).toHaveText('(empty)');

  await measurementRow.actions.rename(newLabel);

  await expect(DOMOverlayPageObject.dialog.input.locator).toBeHidden();

  await expect(measurementRow.title).toHaveText(newLabel);
});
