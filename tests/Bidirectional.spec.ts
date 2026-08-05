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

test('should display the bidirectional tool', async ({
  page,
  DOMOverlayPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await mainToolbarPageObject.measurementTools.bidirectional.click();
  const activeViewport = await viewportPageObject.active;
  await activeViewport.clickAt([
    { x: 405, y: 277 },
    { x: 515, y: 339 },
  ]);
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();

  await checkForScreenshot(
    page,
    viewportPageObject.grid,
    screenShotPaths.bidirectional.bidirectionalDisplayedCorrectly
  );

  await rightPanelPageObject.measurementsPanel.select();

  await expectAnnotationStatsText({
    page,
    activeViewport,
    rightPanelPageObject,
    toolName: 'Bidirectional',
    expectedPanelPrimaryLines: [
      measurementTextFormatters.bidirectionalLengthLine('195'),
      measurementTextFormatters.bidirectionalWidthLine('130'),
    ],
    expectedSvgLines: [
      measurementTextFormatters.bidirectionalLengthLine('195'),
      measurementTextFormatters.bidirectionalWidthLine('130'),
    ],
    assertStats: stats => {
      expect(stats.unit).toBe('mm');
      expect(Math.round(stats.length as number)).toBe(195);
      expect(Math.round(stats.width as number)).toBe(130);
    },
  });
});
