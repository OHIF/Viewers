import {
  checkForScreenshot,
  expect,
  getAnnotationStats,
  screenShotPaths,
  test,
  visitStudy,
  waitForViewportRenderCycle,
} from './utils';

/**
 * Asserts the arrow annotation text across every surface that should reflect it:
 *  - the tracked measurements side panel row title,
 *  - the DOM SVG linked text box rendered in the viewport, and
 *  - the source-of-truth cornerstone annotation state (`data.label`).
 *
 * This avoids relying on the screenshot alone (whose font rendering differs
 * between systems) to assert the text is correct, mirroring the DOM/state
 * assertions in the SCOORD rectangle test.
 */
async function expectArrowText({
  page,
  activeViewport,
  rightPanelPageObject,
  annotationUID,
  expectedText,
}) {
  // Side panel: the measurement row title reflects the arrow text.
  await expect(rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0).title).toHaveText(
    expectedText
  );

  // DOM SVG: the arrow's linked text box renders the arrow text, independent of
  // any system font differences.
  const svgTextLines = activeViewport.getSvgAnnotationStatTextLines(annotationUID);
  await expect(svgTextLines).toHaveCount(1);
  await expect(svgTextLines.nth(0)).toHaveText(expectedText);

  // Source-of-truth annotation state. ArrowAnnotate stores its text on
  // `data.label` rather than computed `cachedStats`, so read with requireStats: false.
  const [arrow] = await getAnnotationStats(page, {
    toolName: 'ArrowAnnotate',
    requireStats: false,
  });
  expect(arrow.annotationUID).toBe(annotationUID);
  expect(arrow.label).toBe(expectedText);
}

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

  const activeViewport = await viewportPageObject.active;
  await activeViewport.clickAt([
    { x: 164, y: 234 },
    { x: 344, y: 232 },
  ]);

  await DOMOverlayPageObject.dialog.input.fillAndSave(
    'Ringo Starr was the drummer for The Beatles'
  );

  const viewportRenderCycle = waitForViewportRenderCycle(page);

  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();

  await viewportRenderCycle;

  await checkForScreenshot({
    page,
    screenshotPath: screenShotPaths.arrowAnnotate.arrowAnnotateDisplayedCorrectly0,
  });

  // Resolve the arrow annotation UID once; it remains stable across subsequent edits.
  const [arrow] = await getAnnotationStats(page, {
    toolName: 'ArrowAnnotate',
    requireStats: false,
  });
  const annotationUID = arrow.annotationUID;

  await expectArrowText({
    page,
    activeViewport,
    rightPanelPageObject,
    annotationUID,
    expectedText: 'Ringo Starr was the drummer for The Beatles',
  });

  // Double-clicking the arrow re-opens the text dialog. ArrowAnnotate stores its
  // text on `data.label`, so the new text replaces it across the viewport SVG,
  // the side panel and the annotation state.

  await activeViewport.doubleClickAt({ x: 164, y: 234 });

  await DOMOverlayPageObject.dialog.input.fillAndSave('Neil Peart was the drummer for Rush');

  await checkForScreenshot({
    page,
    screenshotPath: screenShotPaths.arrowAnnotate.arrowAnnotateDisplayedCorrectly1,
  });

  await expectArrowText({
    page,
    activeViewport,
    rightPanelPageObject,
    annotationUID,
    expectedText: 'Neil Peart was the drummer for Rush',
  });

  // Renaming from the side panel updates the same `data.label`, so the new text
  // is reflected everywhere as well.

  await rightPanelPageObject.measurementsPanel.panel
    .nthMeasurement(0)
    .actions.rename('Drummer annotation arrow');

  await checkForScreenshot({
    page,
    screenshotPath: screenShotPaths.arrowAnnotate.arrowAnnotateDisplayedCorrectly2,
  });

  await expectArrowText({
    page,
    activeViewport,
    rightPanelPageObject,
    annotationUID,
    expectedText: 'Drummer annotation arrow',
  });
});
