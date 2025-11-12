import {
  checkForScreenshot,
  screenShotPaths,
  simulateNormalizedClickOnElement,
  simulateNormalizedClicksOnElement,
  test,
  visitStudy,
} from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should the context menu completely on screen and is not clipped for a point near the bottom edge of the screen', async ({
  page,
  mainToolbarPageObject,
  viewportGridPageObject,
}) => {
  await mainToolbarPageObject.measurementTools.length.click();
  const activeViewport = viewportGridPageObject.activeViewport;
  await simulateNormalizedClicksOnElement({
    locator: activeViewport,
    normalizedPoints: [
      { x: 0.45, y: 0.98 },
      { x: 0.55, y: 0.98 },
    ],
  });

  await page.getByTestId('prompt-begin-tracking-yes-btn').click();

  await checkForScreenshot(page, page, screenShotPaths.contextMenu.preContextMenuNearBottomEdge);

  await simulateNormalizedClickOnElement({
    locator: activeViewport,
    normalizedPoint: { x: 0.55, y: 0.98 },
    button: 'right',
  });

  await checkForScreenshot({
    page,
    locator: page,
    screenshotPath: screenShotPaths.contextMenu.contextMenuNearBottomEdgeNotClipped,
  });
});
