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

test('should display the probe tool', async ({
  page,
  DOMOverlayPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await mainToolbarPageObject.moreTools.probe.click();
  const activeViewport = await viewportPageObject.active;
  await activeViewport.clickAt([{ x: 550, y: 200 }]);
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.probe.probeDisplayedCorrectly,
  });

  await rightPanelPageObject.measurementsPanel.select();

  const expectedValue = 98.0;
  const expectedIndex = [312, 154, 0];

  // Probe panel: single value line (no index coordinates).
  // Probe SVG: 2 lines – voxel index "(i, j, k)" then the HU value.
  await expectAnnotationStatsText({
    page,
    activeViewport,
    rightPanelPageObject,
    toolName: 'Probe',
    expectedPanelPrimaryLines: [measurementTextFormatters.probeValueLine(expectedValue.toFixed(1))],
    expectedSvgLines: [
      measurementTextFormatters.probeIndexSvgLine(expectedIndex),
      measurementTextFormatters.probeValueLine(expectedValue.toFixed(1)),
    ],
    assertStats: stats => {
      expect(stats.modalityUnit).toBe('HU');
      expect(stats.value as number).toBeCloseTo(expectedValue, 1);
      expect(stats.index as number[]).toEqual(expectedIndex);
    },
  });
});
