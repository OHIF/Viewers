import { checkForScreenshot, screenShotPaths, test, visitStudy } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  await visitStudy(page, studyInstanceUID);
});

test('should the context menu completely on screen and is not clipped for a point near the bottom edge of the screen', async ({
  page,
  DOMOverlayPageObject,
  mainToolbarPageObject,
  viewportPageObject,
}) => {
  await mainToolbarPageObject.measurementTools.length.click();
  const activeViewport = await viewportPageObject.active;
  await activeViewport.normalizedClickAt([
    { x: 0.45, y: 0.98 },
    { x: 0.55, y: 0.98 },
  ]);

  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();

  await checkForScreenshot(page, page, screenShotPaths.contextMenu.preContextMenuNearBottomEdge);

  await activeViewport.normalizedClickAt([{ x: 0.55, y: 0.98 }], 'right');

  await checkForScreenshot({
    page,
    locator: page,
    screenshotPath: screenShotPaths.contextMenu.contextMenuNearBottomEdgeNotClipped,
  });
});
