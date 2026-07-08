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

test('should display the length tool', async ({
  page,
  DOMOverlayPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await mainToolbarPageObject.measurementTools.length.click();
  const activeViewport = await viewportPageObject.active;
  await activeViewport.clickAt([
    { x: 364, y: 234 },
    { x: 544, y: 232 },
  ]);
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();

  await checkForScreenshot(
    page,
    viewportPageObject.grid,
    screenShotPaths.length.lengthDisplayedCorrectly
  );

  await rightPanelPageObject.measurementsPanel.select();

  await expectAnnotationStatsText({
    page,
    activeViewport,
    rightPanelPageObject,
    toolName: 'Length',
    formatPanelPrimaryLines: [measurementTextFormatters.lengthLine],
    formatSvgLines: [measurementTextFormatters.lengthLine],
    assertStats: stats => {
      expect(stats.unit).toBe('mm');
      expect(Math.round(stats.length as number)).toBe(278);
    },
  });
});
