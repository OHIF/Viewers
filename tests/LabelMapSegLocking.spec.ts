import { checkForScreenshot, screenShotPaths, test, visitStudy } from './utils';
import { press } from './utils/keyboardUtils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.256467663913010332776401703474716742458';
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should prevent editing of label map segmentations when panelSegmentation.disableEditing is true', async ({
  page,
  viewportPageObject,
}) => {
  // disable editing of segmentations via the customization service
  await page.evaluate(() => {
    window.services.customizationService.setGlobalCustomization(
      'panelSegmentation.disableEditing',
      {
        $set: true,
      }
    );
  });
  await page.getByTestId('panelSegmentationWithToolsLabelMap-btn').click();

  await page.getByTestId('study-browser-thumbnail-no-image').dblclick();
  // Wait for the segmentation to be loaded.
  await page.waitForTimeout(5000);

  await page.getByTestId('yes-hydrate-btn').click();

  // Wait for the segmentation to hydrate.
  await page.waitForTimeout(5000);

  // navigate to the 12th image and ensure the correct overlay is displayed
  await press({ page, key: 'ArrowDown', nTimes: 11 });

  await checkForScreenshot(page, page, screenShotPaths.labelMapSegLocking.globalLockedSegPreEdit);

  // Attempt to erase the segmentations.
  await page.getByTestId('Eraser-btn').click();

  // Use the largest eraser radius to help ensure the entire image is erased.
  await page.locator(`css=div[data-cy="eraser-radius"] input`).fill('1000');

  // Attempt to erase the segmentations by dragging the eraser tool across the image several times.
  await viewportPageObject.getById('default').normalizedDragAt({
    start: { x: 0.01, y: 0.25 },
    end: { x: 1.0, y: 0.25 },
  });
  await viewportPageObject.getById('default').normalizedDragAt({
    start: { x: 0.01, y: 0.5 },
    end: { x: 1.0, y: 0.5 },
  });
  await viewportPageObject.getById('default').normalizedDragAt({
    start: { x: 0.01, y: 0.75 },
    end: { x: 1.0, y: 0.75 },
  });

  await checkForScreenshot(page, page, screenShotPaths.labelMapSegLocking.globalLockedSegPostEdit);
});

test('should allow editing of label map segmentations when panelSegmentation.disableEditing is false', async ({
  page,
  viewportPageObject,
}) => {
  // disable editing of segmentations via the customization service
  await page.evaluate(() => {
    window.services.customizationService.setGlobalCustomization(
      'panelSegmentation.disableEditing',
      {
        $set: false,
      }
    );
  });

  await page.getByTestId('panelSegmentationWithToolsLabelMap-btn').click();

  await page.getByTestId('study-browser-thumbnail-no-image').dblclick();
  // Wait for the segmentation to be loaded.
  await page.waitForTimeout(5000);

  await page.getByTestId('yes-hydrate-btn').click();
  // Wait for the segmentation to hydrate.
  await page.waitForTimeout(5000);

  // navigate to the 12th image and ensure the correct overlay is displayed
  await press({ page, key: 'ArrowDown', nTimes: 11 });

  await checkForScreenshot(page, page, screenShotPaths.labelMapSegLocking.globalUnlockedSegPreEdit);

  // Attempt to erase the segmentations.
  await page.getByTestId('Eraser-btn').click();

  // Use the largest eraser radius to help ensure the eraser passes over the entire image.
  await page.locator(`css=div[data-cy="eraser-radius"] input`).fill('1000');

  // Attempt to erase the segmentations by dragging the eraser tool across the image several times.
  await viewportPageObject.getById('default').normalizedDragAt({
    start: { x: 0.01, y: 0.25 },
    end: { x: 1.0, y: 0.25 },
  });
  await viewportPageObject.getById('default').normalizedDragAt({
    start: { x: 0.01, y: 0.5 },
    end: { x: 1.0, y: 0.5 },
  });
  await viewportPageObject.getById('default').normalizedDragAt({
    start: { x: 0.01, y: 0.75 },
    end: { x: 1.0, y: 0.75 },
  });

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.labelMapSegLocking.globalUnlockedSegPostEdit
  );
});
