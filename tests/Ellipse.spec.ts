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

test('should display the ellipse tool', async ({
  page,
  DOMOverlayPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await mainToolbarPageObject.measurementTools.ellipticalROI.click();
  const activeViewport = await viewportPageObject.active;
  await activeViewport.clickAt([
    { x: 446, y: 245 },
    { x: 508, y: 281 },
  ]);
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();

  await checkForScreenshot(
    page,
    viewportPageObject.grid,
    screenShotPaths.ellipse.ellipseDisplayedCorrectly
  );

  await rightPanelPageObject.measurementsPanel.select();

  // EllipticalROI panel: area (no prefix) + Max (with prefix).
  // EllipticalROI SVG: Area, Mean, Max, Min, Std Dev (5 lines for CT modality).
  await expectAnnotationStatsText({
    page,
    activeViewport,
    rightPanelPageObject,
    toolName: 'EllipticalROI',
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
      expect(Math.round(stats.area as number)).toBe(16778);
      expect(stats.modalityUnit).toBe('HU');
      expect(stats.mean as number).toBeCloseTo(83.1, 1);
      expect(Math.round(stats.max as number)).toBe(296);
      expect(Math.round(stats.min as number)).toBe(-64.0);
      expect(stats.stdDev as number).toBeCloseTo(46.3, 1);
    },
  });
});
