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
    expectedPanelPrimaryLines: [
      measurementTextFormatters.areaPanelLine('13741'),
      measurementTextFormatters.maxLine('263'),
    ],
    expectedSvgLines: [
      measurementTextFormatters.circleRadiusSvgLine('66.1'),
      measurementTextFormatters.areaSvgLine('13741'),
      measurementTextFormatters.meanSvgLine('94.4'),
      measurementTextFormatters.maxLine('263'),
      measurementTextFormatters.minSvgLine('-68.0'),
      measurementTextFormatters.stdDevSvgLine('44.9'),
    ],
    assertStats: stats => {
      expect(stats.areaUnit).toBe('mm²');
      expect(Math.round(stats.area as number)).toBe(13741);
      expect(stats.radiusUnit).toBe('mm');
      expect(stats.radius as number).toBeCloseTo(66.1, 1);
      expect(stats.modalityUnit).toBe('HU');
      expect(stats.mean as number).toBeCloseTo(94.4, 1);
      expect(Math.round(stats.max as number)).toBe(263);
      expect(stats.min as number).toBeCloseTo(-68.0, 1);
      expect(stats.stdDev as number).toBeCloseTo(44.9, 1);
    },
  });
});
