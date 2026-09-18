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

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.cobbangle.cobbangleDisplayedCorrectly,
  });

  await rightPanelPageObject.measurementsPanel.select();

  const expectedCobbAngle = 1.66;

  await expectAnnotationStatsText({
    page,
    activeViewport,
    rightPanelPageObject,
    toolName: 'CobbAngle',
    expectedPanelPrimaryLines: [measurementTextFormatters.angleLine(`${expectedCobbAngle}`)],
    expectedSvgLines: [measurementTextFormatters.angleLine(`${expectedCobbAngle}`)],
    assertStats: stats => {
      expect(stats.angle as number).toBeCloseTo(expectedCobbAngle, 2);
    },
  });
});
