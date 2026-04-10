import { expect, test, visitStudy } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.7310.5101.860473186348887719777907797922';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should properly reload SR series after hydration', async ({
  page,
  DOMOverlayPageObject,
  leftPanelPageObject,
  rightPanelPageObject,
}) => {
  await rightPanelPageObject.toggle();
  await rightPanelPageObject.measurementsPanel.select();

  await leftPanelPageObject.loadSeriesByModality('SR');
  await page.waitForTimeout(2000);
  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();
  await page.waitForTimeout(2000);

  const measurementCountAfterFirstLoad =
    await rightPanelPageObject.measurementsPanel.panel.getMeasurementCount();
  expect(measurementCountAfterFirstLoad).toBeGreaterThan(0);

  await rightPanelPageObject.measurementsPanel.panel.nthMeasurement(1).click();
  await page.waitForTimeout(1000);

  await leftPanelPageObject.loadSeriesByModality('SR');
  await page.waitForTimeout(2000);

  const measurementCountAfterSecondLoad =
    await rightPanelPageObject.measurementsPanel.panel.getMeasurementCount();

  expect(measurementCountAfterSecondLoad).toBe(measurementCountAfterFirstLoad);
});
