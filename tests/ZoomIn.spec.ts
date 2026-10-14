import { checkForScreenshot, screenShotPaths, test, visitStudy } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.12.2.1107.5.2.32.35162.30000015050317233592200000046';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should render the magnified region with the same horizontal flip as the source viewport', async ({
  page,
  mainToolbarPageObject,
  viewportPageObject,
}) => {
  await mainToolbarPageObject.moreTools.flipHorizontal.click();

  const activeViewport = await viewportPageObject.active;

  await activeViewport.sliceNavigation.toSlice(61);

  await mainToolbarPageObject.moreTools.magnify.click();

  await activeViewport.magnifyGlass.drag({
    start: { x: 0.78, y: 0.91 },
    mouseUp: false,
  });

  await checkForScreenshot(
    page,
    activeViewport.magnifyGlass.locator,
    screenShotPaths.zoomIn.magnifyViewportDisplayedCorrectly
  );

  await activeViewport.magnifyGlass.stopDrag();
});
