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

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.rectangle.rectangleDisplayedCorrectly,
  });

  await rightPanelPageObject.measurementsPanel.select();

  const expectedArea = 15959;
  const expectedMax = 295;
  // Cornerstone3D selects the voxels whose centres lie inside the rectangle.
  // The older code walked the index bounding box and applied no shape test, so
  // it also counted a border of voxels outside the rectangle. The mean and the
  // standard deviation therefore move a little; the area and the two extremes
  // do not.
  const expectedMean = 79.8;
  const expectedMin = -77.0;
  const expectedStdDev = 38.1;

  // RectangleROI panel: area (no prefix) + Max (with prefix).
  // RectangleROI SVG: Area, Mean, Max, Min, Std Dev (5 lines for CT modality).
  await expectAnnotationStatsText({
    page,
    activeViewport,
    rightPanelPageObject,
    toolName: 'RectangleROI',
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
