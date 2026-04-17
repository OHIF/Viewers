import { checkForScreenshot, screenShotPaths, test, visitStudy, expect } from './utils';
import { press } from './utils/keyboardUtils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should display the spline tool', async ({
  page,
  DOMOverlayPageObject,
  mainToolbarPageObject,
  viewportPageObject,
}) => {
  await mainToolbarPageObject.measurementTools.splineROI.click();
  const activeViewport = await viewportPageObject.active;
  await activeViewport.clickAt([
    { x: 380, y: 459 },
    { x: 420, y: 396 },
    { x: 523, y: 392 },
    { x: 581, y: 447 },
    { x: 482, y: 493 },
    { x: 383, y: 461 },
  ]);
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();
  await checkForScreenshot(page, page, screenShotPaths.spline.splineDisplayedCorrectly);
});

test('should restore viewport interactivity after deleting an in-progress Spline annotation via context menu', async ({
  DOMOverlayPageObject,
  mainToolbarPageObject,
  viewportPageObject,
}) => {
  await mainToolbarPageObject.measurementTools.splineROI.click();

  const activeViewport = await viewportPageObject.active;
  await activeViewport.clickAt([
    { x: 380, y: 299 },
    { x: 420, y: 236 },
    { x: 523, y: 232 },
  ]);

  await activeViewport.clickAt([{ x: 550, y: 312 }], 'right');

  const deleteButton = DOMOverlayPageObject.viewport.annotationContextMenu.delete;
  await expect(deleteButton.locator).toBeVisible();
  await deleteButton.click();

  await expect(activeViewport.nthAnnotation(0).locator).toBeHidden();

  // Draw and complete a new Spline annotation to verify interactivity is restored
  await activeViewport.clickAt([
    { x: 380, y: 299 },
    { x: 420, y: 236 },
    { x: 523, y: 232 },
    { x: 581, y: 287 },
    { x: 482, y: 333 },
    { x: 383, y: 301 },
  ]);
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();
  await expect(activeViewport.nthAnnotation(0).locator).toBeVisible();
});

test('should restore viewport interactivity after deleting an in-progress Spline annotation via Backspace', async ({
  page,
  DOMOverlayPageObject,
  mainToolbarPageObject,
  viewportPageObject,
}) => {
  await mainToolbarPageObject.measurementTools.splineROI.click();

  const activeViewport = await viewportPageObject.active;
  await activeViewport.clickAt([
    { x: 380, y: 299 },
    { x: 420, y: 236 },
    { x: 523, y: 232 },
  ]);

  // Ensure the three points clicked above are rendered in the DOM before pressing Backspace
  await expect(activeViewport.svg('circle')).toHaveCount(3);
  await press({ page, key: 'Backspace' });

  await expect(activeViewport.nthAnnotation(0).locator).toBeHidden();

  // Draw and complete a new Spline annotation to verify interactivity is restored
  await activeViewport.clickAt([
    { x: 380, y: 299 },
    { x: 420, y: 236 },
    { x: 523, y: 232 },
    { x: 581, y: 287 },
    { x: 482, y: 333 },
    { x: 383, y: 301 },
  ]);
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();
  await expect(activeViewport.nthAnnotation(0).locator).toBeVisible();
});
