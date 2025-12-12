import { checkForScreenshot, screenShotPaths, test, visitStudy } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should display the arrow tool and allow free-form text to be entered', async ({
  page,
  DOMOverlayPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await rightPanelPageObject.measurementsPanel.select();

  await mainToolbarPageObject.measurementTools.arrowAnnotate.click();

  await viewportPageObject.active.clickAt([
    { x: 164, y: 234 },
    { x: 344, y: 232 },
  ]);

  await DOMOverlayPageObject.dialog.input.fillAndSave(
    'Ringo Starr was the drummer for The Beatles'
  );

  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();

  await page.waitForTimeout(2000);

  await checkForScreenshot({
    page,
    maxDiffPixelRatio: 0.0075,
    screenshotPath: screenShotPaths.arrowAnnotate.arrowAnnotateDisplayedCorrectly0,
  });

  // Now edit the arrow text and the label should not change.

  await viewportPageObject.active.doubleClickAt({ x: 164, y: 234 });

  await DOMOverlayPageObject.dialog.input.fillAndSave('Neil Peart was the drummer for Rush');

  await page.waitForTimeout(2000);

  await checkForScreenshot({
    page,
    maxDiffPixelRatio: 0.0075,
    screenshotPath: screenShotPaths.arrowAnnotate.arrowAnnotateDisplayedCorrectly1,
  });

  // Now edit the label and the text should not change.

  await rightPanelPageObject.measurementsPanel.panel
    .nthMeasurement(0)
    .actions.rename('Drummer annotation arrow');

  await page.waitForTimeout(2000);

  await checkForScreenshot({
    page,
    maxDiffPixelRatio: 0.0075,
    screenshotPath: screenShotPaths.arrowAnnotate.arrowAnnotateDisplayedCorrectly2,
  });
});
