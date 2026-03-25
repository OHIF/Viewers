import {
  attemptAction,
  reduce3DViewportSize,
  screenShotPaths,
  test,
  visitStudyRendered,
} from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.1706.8374.643249677828306008300337414785';
  await visitStudyRendered(page, studyInstanceUID);
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

    await viewportPageObject.checkForScreenshot(
      screenShotPaths.segHydrationFrom3DFourUp.threeDFourUpBeforeSEG
    );

    await leftPanelPageObject.loadSeriesByDescription('SEG');
    await mainToolbarPageObject.waitForViewportsRendered();

    await viewportPageObject.checkForScreenshot(
      screenShotPaths.segHydrationFrom3DFourUp.threeDFourUpAfterSEG
    );

    await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();
    await mainToolbarPageObject.waitForViewportsRendered();

    await viewportPageObject.checkForScreenshot(
      screenShotPaths.segHydrationFrom3DFourUp.threeDFourUpAfterSegHydrated,
      { screenshotTimeout: 30_000 }
    );
  });
});
