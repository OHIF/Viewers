import {
  checkForViewportScreenshot,
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
  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.circle.circleDisplayedCorrectly,
  });

  await rightPanelPageObject.measurementsPanel.select();

  const expectedArea = 13741;
  const expectedMax = 263;
  const expectedRadius = 66.1;
  const expectedMean = 94.4;
  const expectedMin = -68.0;
  const expectedStdDev = 44.9;

  // CircleROI panel: area (no prefix) + Max (with prefix).
  // CircleROI SVG: Radius, Area, Mean, Max, Min, Std Dev (6 lines for CT modality).
  await expectAnnotationStatsText({
    page,
    activeViewport,
    rightPanelPageObject,
    toolName: 'CircleROI',
    expectedPanelPrimaryLines: [
      measurementTextFormatters.areaPanelLine(`${expectedArea}`),
      measurementTextFormatters.maxLine(`${expectedMax}`),
    ],
    expectedSvgLines: [
      measurementTextFormatters.circleRadiusSvgLine(`${expectedRadius}`),
      measurementTextFormatters.areaSvgLine(`${expectedArea}`),
      measurementTextFormatters.meanSvgLine(`${expectedMean}`),
      measurementTextFormatters.maxLine(`${expectedMax}`),
      measurementTextFormatters.minSvgLine(expectedMin.toFixed(1)),
      measurementTextFormatters.stdDevSvgLine(`${expectedStdDev}`),
    ],
    assertStats: stats => {
      expect(stats.areaUnit).toBe('mm²');
      expect(Math.round(stats.area as number)).toBe(expectedArea);
      expect(stats.radiusUnit).toBe('mm');
      expect(stats.radius as number).toBeCloseTo(expectedRadius, 1);
      expect(stats.modalityUnit).toBe('HU');
      expect(stats.mean as number).toBeCloseTo(expectedMean, 1);
      expect(Math.round(stats.max as number)).toBe(expectedMax);
      expect(stats.min as number).toBeCloseTo(expectedMin, 1);
      expect(stats.stdDev as number).toBeCloseTo(expectedStdDev, 1);
    },
  });
});
