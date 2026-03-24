import { type ViewportScreenshotStabilization, screenShotPaths, test, visitStudy } from './utils';

/** Stabilizes overlays and the arrow text box; `annotationText` matches what was just saved or renamed. */
function arrowAnnotateStabilization(annotationText: string): ViewportScreenshotStabilization {
  return {
    seriesDate: '22-May-2014',
    seriesDescription: '2.0',
    windowLevel: 'W: 230 L: 100',
    imageInfo: 'I:1 (1/2)',
    annotations: [{ type: 'arrowAnnotate', text: annotationText, size: 220 }],
  };
}

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  await visitStudy(page, studyInstanceUID);
});

test('should display the arrow tool and allow free-form text to be entered shouldUpdateThis', async ({
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

  await mainToolbarPageObject.waitForViewportsRendered();

  await viewportPageObject.checkForScreenshot(
    screenShotPaths.arrowAnnotate.arrowAnnotateDisplayedCorrectly0,
    {
      maxDiffPixelRatio: 0.0075,
      stabilization: arrowAnnotateStabilization('Ringo Starr was the drummer for The Beatles'),
    }
  );

  // Now edit the arrow text and the label should not change.

  await viewportPageObject.active.doubleClickAt({ x: 164, y: 234 });

  await DOMOverlayPageObject.dialog.input.fillAndSave('Neil Peart was the drummer for Rush');

  await mainToolbarPageObject.waitForViewportsRendered();

  await viewportPageObject.checkForScreenshot(
    screenShotPaths.arrowAnnotate.arrowAnnotateDisplayedCorrectly1,
    {
      maxDiffPixelRatio: 0.0075,
      stabilization: arrowAnnotateStabilization('Neil Peart was the drummer for Rush'),
    }
  );

  // Now edit the label and the text should not change.

  await rightPanelPageObject.measurementsPanel.panel
    .nthMeasurement(0)
    .actions.rename('Drummer annotation arrow');

  await mainToolbarPageObject.waitForViewportsRendered();

  await viewportPageObject.checkForScreenshot(
    screenShotPaths.arrowAnnotate.arrowAnnotateDisplayedCorrectly2,
    {
      maxDiffPixelRatio: 0.0075,
      stabilization: arrowAnnotateStabilization('Drummer annotation arrow'),
    }
  );
});
