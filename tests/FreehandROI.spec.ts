import { expect, test, visitStudy, subscribeToMeasurementAdded } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should not fire MEASUREMENT_ADDED when clicking the annotation text', async ({
  page,
  DOMOverlayPageObject,
  mainToolbarPageObject,
  viewportPageObject,
}) => {
  await mainToolbarPageObject.measurementTools.freehandROI.click();
  await viewportPageObject.active.normalizedDragAt({
    start: { x: 0.35, y: 0.35 },
    end: { x: 0.6, y: 0.55 },
    config: { steps: 20, delay: 30 },
  });

  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();

  const measurementAdded = await subscribeToMeasurementAdded(page);
  try {
    const annotation = viewportPageObject.active.nthAnnotation(0);
    await annotation.text.click();

    await expect(measurementAdded.waitFired(1000)).rejects.toThrow();

  } finally {
    await measurementAdded.unsubscribe();
  }
});
