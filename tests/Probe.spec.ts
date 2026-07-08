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

  await checkForScreenshot(
    page,
    viewportPageObject.grid,
    screenShotPaths.probe.probeDisplayedCorrectly
  );

  await rightPanelPageObject.measurementsPanel.select();

  // Probe panel: single value line (no index coordinates).
  // Probe SVG: 2 lines – voxel index "(i, j, k)" then the HU value.
  await expectAnnotationStatsText({
    page,
    activeViewport,
    rightPanelPageObject,
    toolName: 'Probe',
    formatPanelPrimaryLines: [measurementTextFormatters.probePanelLine],
    formatSvgLines: [
      measurementTextFormatters.probeIndexSvgLine,
      measurementTextFormatters.probePanelLine,
    ],
    assertStats: stats => {
      expect(stats.modalityUnit).toBe('HU');
      expect(typeof stats.value).toBe('number');
      expect(Array.isArray(stats.index)).toBe(true);
    },
  });
});
