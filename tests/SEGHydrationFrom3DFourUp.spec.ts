import {
  attemptAction,
  checkForScreenshot,
  reduce3DViewportSize,
  screenShotPaths,
  test,
  visitStudy,
  waitForPaintToSettle,
  waitForViewportsRendered,
  waitForViewportRenderCycle,
  expect,
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

    let viewportRenderCycle = waitForViewportRenderCycle(page);
    await leftPanelPageObject.loadSeriesByDescription('SEG');

    await viewportRenderCycle;

    await checkForScreenshot(
      page,
      viewportPageObject.grid,
      screenShotPaths.segHydrationFrom3DFourUp.threeDFourUpAfterSEG
    );

    // start watching for viewports to render

    // High rendered timeout needed: layout has 4 viewports (3D volume + MPR planes + SEG overlays),
    // which can take significantly longer time to fully render
    viewportRenderCycle = waitForViewportRenderCycle(page, { renderedTimeout: 180000 });

    await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();

    // Wait until all viewports have finished rendering
    await viewportRenderCycle;
    // 3D volume rendering keeps streaming refined geometry after the load
    // status flips; give the GPU a window to present the final frame before
    // screenshotting.
    await page.waitForTimeout(2000);
    await waitForPaintToSettle(page);

    await checkForScreenshot({
      page,
      locator: viewportPageObject.grid,
      screenshotPath: screenShotPaths.segHydrationFrom3DFourUp.threeDFourUpAfterSegHydrated,
    });
  });
});

test.describe('3D four up to 3x2 layout SEG hydration', () => {
  test.beforeEach(async ({ page }) => {
    const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.256467663913010332776401703474716742458';
    const mode = 'viewer';
    await visitStudy(page, studyInstanceUID, mode, 2000);
  });
  test('should hydrate SEG only in the target viewport and preserve other viewport orientations', async ({
    page,
    DOMOverlayPageObject,
    leftPanelPageObject,
    mainToolbarPageObject,
    viewportPageObject,
  }) => {
    await mainToolbarPageObject.layoutSelection.threeDFourUp.click();

    let viewportRenderCycle = waitForViewportRenderCycle(page);
    // Switch to a manual 3x2 grid layout
    await mainToolbarPageObject.layoutSelection.grid(3, 2).click();
    await viewportRenderCycle;

    // Activate the 3rd viewport (index 2) then load the SEG into it
    await viewportPageObject.getNthLocator(2).click();

    await expect(viewportPageObject.getNthLocator(2)).toHaveAttribute('data-is-active', 'true');

    await leftPanelPageObject.loadSeriesByDescription('SEG');

    await expect(DOMOverlayPageObject.viewport.segmentationHydration.locator).toBeVisible();

    viewportRenderCycle = waitForViewportRenderCycle(page);
    await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();
    await viewportRenderCycle;

    await checkForScreenshot({
      page,
      locator: viewportPageObject.grid,
      screenshotPath: screenShotPaths.segHydrationAfterLayoutSwitchTo3By2.afterSEGHydrated,
    });

    viewportRenderCycle = waitForViewportRenderCycle(page);
    await mainToolbarPageObject.layoutSelection.threeDFourUp.click();
    await viewportRenderCycle;

    await checkForScreenshot({
      page,
      locator: viewportPageObject.grid,
      screenshotPath: screenShotPaths.segHydrationAfterLayoutSwitchTo3By2.backTo3DFourUp,
    });
  });
});
