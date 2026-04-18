import {
  attemptAction,
  checkForScreenshot,
  reduce3DViewportSize,
  screenShotPaths,
  test,
  visitStudy,
  waitForViewportsRendered,
  waitForAnyViewportNeedsRender,
} from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.1706.8374.643249677828306008300337414785';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test.describe('3D four up SEG hydration', async () => {
  test('should properly hydrate SEG from 3D four up layout', async ({
    page,
    DOMOverlayPageObject,
    leftPanelPageObject,
    mainToolbarPageObject,
    viewportPageObject,
  }) => {
    await mainToolbarPageObject.layoutSelection.threeDFourUp.click();

    await attemptAction(() => reduce3DViewportSize(page), 10, 100);

    await waitForViewportsRendered(page);

    await checkForScreenshot(
      page,
      viewportPageObject.grid,
      screenShotPaths.segHydrationFrom3DFourUp.threeDFourUpBeforeSEG
    );

    await leftPanelPageObject.loadSeriesByDescription('SEG');

    await waitForViewportsRendered(page);

    await checkForScreenshot(
      page,
      viewportPageObject.grid,
      screenShotPaths.segHydrationFrom3DFourUp.threeDFourUpAfterSEG
    );

    // start watching for viewport to need render
    const needsRender = waitForAnyViewportNeedsRender(page);

    await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();

    // wait for render to start
    await needsRender;

    // High timeout needed: layout has 4 viewports (3D volume + MPR planes + SEG overlays),
    // which can take significantly longer time to fully render
    await waitForViewportsRendered(page, { timeout: 180000 });

    await checkForScreenshot({
      page,
      locator: viewportPageObject.grid,
      screenshotPath: screenShotPaths.segHydrationFrom3DFourUp.threeDFourUpAfterSegHydrated,
    });
  });
});
