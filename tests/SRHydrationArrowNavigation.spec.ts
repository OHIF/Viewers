import { expect, navigateWithViewportArrow, test, visitStudy } from './utils';
import { expectRowSelected } from './utils/assertions';
import { press } from './utils/keyboardUtils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.7310.5101.860473186348887719777907797922';
  await visitStudy(page, studyInstanceUID);
});

test('should navigate SR measurements with next/prev arrows after hydration for 3D SR', async ({
  page,
  DOMOverlayPageObject,
  leftPanelPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await rightPanelPageObject.toggle();
  await rightPanelPageObject.measurementsPanel.select();
  await leftPanelPageObject.loadSeriesByModality('SR');
  await page.waitForTimeout(2000);

  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();
  await page.waitForTimeout(2000);

  const measurementCount = await rightPanelPageObject.measurementsPanel.panel.getMeasurementCount();
  expect(measurementCount).toBeGreaterThan(1);

  // Navigate to first image
  await viewportPageObject.active.pane.click();
  await press({ page, key: 'Home' });
  await page.waitForTimeout(2000);

  // first arrow click should navigate to second measurement
  await navigateWithViewportArrow(viewportPageObject, 'next');

  await expectRowSelected(rightPanelPageObject.measurementsPanel.panel.nthMeasurement(1));

  await expect(viewportPageObject.active.svg('circle')).toBeVisible();

  const secondAnnotation = viewportPageObject.active.nthAnnotation(0);
  await expect(secondAnnotation.locator).toBeVisible();
  await expect(secondAnnotation.text.locator).toBeVisible();

  // navigate back to first measurement
  await navigateWithViewportArrow(viewportPageObject, 'prev');

  await expectRowSelected(rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0));

  await expect(viewportPageObject.active.svg('circle')).toBeVisible();

  const firstAnnotation = viewportPageObject.active.nthAnnotation(0);
  await expect(firstAnnotation.locator).toBeVisible();
  await expect(firstAnnotation.text.locator).toBeVisible();
});

test('should keep arrows visible and functional after clicking measurement in right panel', async ({
  page,
  DOMOverlayPageObject,
  leftPanelPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await rightPanelPageObject.toggle();
  await rightPanelPageObject.measurementsPanel.select();
  await leftPanelPageObject.loadSeriesByModality('SR');
  await page.waitForTimeout(2000);

  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();
  await page.waitForTimeout(2000);

  const measurementCount = await rightPanelPageObject.measurementsPanel.panel.getMeasurementCount();
  expect(measurementCount).toBeGreaterThan(1);

  // click on first measurement
  await rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0).click();

  await expect(viewportPageObject.active.nthAnnotation(0).locator).toBeVisible();

  await expect(viewportPageObject.active.navigationArrows.next.button).toBeVisible();
  await expect(viewportPageObject.active.navigationArrows.prev.button).toBeVisible();

  // navigate to second measurement
  await navigateWithViewportArrow(viewportPageObject, 'next');

  await expectRowSelected(rightPanelPageObject.measurementsPanel.panel.nthMeasurement(1));
  await expect(viewportPageObject.active.nthAnnotation(0).locator).toBeVisible();

  // navigate back to first measurement
  await navigateWithViewportArrow(viewportPageObject, 'prev');

  await expectRowSelected(rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0));
  await expect(viewportPageObject.active.nthAnnotation(0).locator).toBeVisible();
});
