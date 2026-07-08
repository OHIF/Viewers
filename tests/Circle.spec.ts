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

test('should display the circle tool', async ({
  page,
  DOMOverlayPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await mainToolbarPageObject.measurementTools.circleROI.click();
  const activeViewport = await viewportPageObject.active;
  await activeViewport.clickAt([
    { x: 480, y: 205 },
    { x: 488, y: 247 },
  ]);
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();
  await checkForScreenshot(
    page,
    viewportPageObject.grid,
    screenShotPaths.circle.circleDisplayedCorrectly
  );

  await rightPanelPageObject.measurementsPanel.select();

  // CircleROI panel: area (no prefix) + Max (with prefix).
  // CircleROI SVG: Radius, Area, Mean, Max, Min, Std Dev (6 lines for CT modality).
  await expectAnnotationStatsText({
    page,
    activeViewport,
    rightPanelPageObject,
    toolName: 'CircleROI',
    formatPanelPrimaryLines: [
      measurementTextFormatters.areaPanelLine,
      measurementTextFormatters.maxLine,
    ],
    formatSvgLines: [
      measurementTextFormatters.circleRadiusSvgLine,
      measurementTextFormatters.areaSvgLine,
      measurementTextFormatters.meanSvgLine,
      measurementTextFormatters.maxLine,
      measurementTextFormatters.minSvgLine,
      measurementTextFormatters.stdDevSvgLine,
    ],
    assertStats: stats => {
      expect(stats.areaUnit).toBe('mm²');
      expect(stats.area as number).toBeGreaterThan(0);
      expect(stats.radiusUnit).toBe('mm');
      expect(stats.radius as number).toBeGreaterThan(0);
      expect(stats.modalityUnit).toBe('HU');
    },
  });
});
