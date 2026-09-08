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

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.ellipse.ellipseDisplayedCorrectly,
  });

  await rightPanelPageObject.measurementsPanel.select();

  const expectedArea = 16778;
  const expectedMax = 296;
  const expectedMean = 83.1;
  const expectedMin = -64.0;
  const expectedStdDev = 46.3;

  // EllipticalROI panel: area (no prefix) + Max (with prefix).
  // EllipticalROI SVG: Area, Mean, Max, Min, Std Dev (5 lines for CT modality).
  await expectAnnotationStatsText({
    page,
    activeViewport,
    rightPanelPageObject,
    toolName: 'EllipticalROI',
    expectedPanelPrimaryLines: [
      measurementTextFormatters.areaPanelLine(`${expectedArea}`),
      measurementTextFormatters.maxLine(`${expectedMax}`),
    ],
    expectedSvgLines: [
      measurementTextFormatters.areaSvgLine(`${expectedArea}`),
      measurementTextFormatters.meanSvgLine(`${expectedMean}`),
      measurementTextFormatters.maxLine(`${expectedMax}`),
      measurementTextFormatters.minSvgLine(expectedMin.toFixed(1)),
      measurementTextFormatters.stdDevSvgLine(`${expectedStdDev}`),
    ],
    assertStats: stats => {
      expect(stats.areaUnit).toBe('mm²');
      expect(Math.round(stats.area as number)).toBe(expectedArea);
      expect(stats.modalityUnit).toBe('HU');
      expect(stats.mean as number).toBeCloseTo(expectedMean, 1);
      expect(Math.round(stats.max as number)).toBe(expectedMax);
      expect(Math.round(stats.min as number)).toBe(expectedMin);
      expect(stats.stdDev as number).toBeCloseTo(expectedStdDev, 1);
    },
  });
});
