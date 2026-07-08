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

test('should display the cobb angle tool', async ({
  page,
  DOMOverlayPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await mainToolbarPageObject.moreTools.cobbAngle.click();
  const activeViewport = await viewportPageObject.active;
  await activeViewport.clickAt([
    { x: 515, y: 212 },
    { x: 616, y: 207 },
    { x: 527, y: 293 },
    { x: 625, y: 291 },
  ]);
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();

  await checkForScreenshot(
    page,
    viewportPageObject.grid,
    screenShotPaths.cobbangle.cobbangleDisplayedCorrectly
  );

  await rightPanelPageObject.measurementsPanel.select();

  // CobbAngle panel uses roundNumber (angleLine), but its SVG uses
  // angle.toFixed(2) directly (cobbAngleSvgLine).
  await expectAnnotationStatsText({
    page,
    activeViewport,
    rightPanelPageObject,
    toolName: 'CobbAngle',
    formatPanelPrimaryLines: [measurementTextFormatters.angleLine],
    formatSvgLines: [measurementTextFormatters.cobbAngleSvgLine],
    assertStats: stats => {
      expect(stats.angle as number).toBeCloseTo(1.66, 2);
    },
  });
});
