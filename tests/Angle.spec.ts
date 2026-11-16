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

test('should display the angle tool', async ({
  page,
  DOMOverlayPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await mainToolbarPageObject.moreTools.angle.click();
  const activeViewport = await viewportPageObject.active;
  await activeViewport.clickAt([
    { x: 550, y: 200 },
    { x: 450, y: 250 },
    { x: 550, y: 300 },
  ]);
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.angle.angleDisplayedCorrectly,
  });

  await rightPanelPageObject.measurementsPanel.select();

  const expectedAngle = 53.1;

  await expectAnnotationStatsText({
    page,
    activeViewport,
    rightPanelPageObject,
    toolName: 'Angle',
    expectedPanelPrimaryLines: [measurementTextFormatters.angleLine(`${expectedAngle}`)],
    expectedSvgLines: [measurementTextFormatters.angleLine(`${expectedAngle}`)],
    assertStats: stats => {
      expect(stats.angle as number).toBeCloseTo(expectedAngle, 1);
    },
  });
});
