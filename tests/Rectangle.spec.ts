import {
  checkForScreenshot,
  expect,
  expectAnnotationStatsText,
  measurementTextFormatters,
  screenShotPaths,
  test,
  visitStudy,
} from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should display the rectangle tool', async ({
  page,
  DOMOverlayPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await mainToolbarPageObject.measurementTools.rectangleROI.click();
  const activeViewport = await viewportPageObject.active;
  await activeViewport.clickAt([
    { x: 476, y: 159 },
    { x: 591, y: 217 },
  ]);
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();

  await checkForScreenshot(
    page,
    viewportPageObject.grid,
    screenShotPaths.rectangle.rectangleDisplayedCorrectly
  );

  await rightPanelPageObject.measurementsPanel.select();

  // RectangleROI panel: area (no prefix) + Max (with prefix).
  // RectangleROI SVG: Area, Mean, Max, Min, Std Dev (5 lines for CT modality).
  await expectAnnotationStatsText({
    page,
    activeViewport,
    rightPanelPageObject,
    toolName: 'RectangleROI',
    formatPanelPrimaryLines: [
      measurementTextFormatters.areaPanelLine,
      measurementTextFormatters.maxLine,
    ],
    formatSvgLines: [
      measurementTextFormatters.areaSvgLine,
      measurementTextFormatters.meanSvgLine,
      measurementTextFormatters.maxLine,
      measurementTextFormatters.minSvgLine,
      measurementTextFormatters.stdDevSvgLine,
    ],
    assertStats: stats => {
      expect(stats.areaUnit).toBe('mm²');
      expect(stats.area as number).toBeGreaterThan(0);
      expect(stats.modalityUnit).toBe('HU');
      expect(typeof stats.max).toBe('number');
    },
  });
});
