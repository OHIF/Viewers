import {
  checkForViewportScreenshot,
  expect,
  screenShotPaths,
  test,
  visitStudy,
  addOHIFConfiguration,
} from './utils';

test.beforeEach(async ({ page }) => {
  await addOHIFConfiguration(page, {
    disableConfirmationPrompts: true,
  });

  const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should auto hydrate RT STRUCT on the second load and keep viewport stable after deleting segmentations', async ({
  page,
  DOMOverlayPageObject,
  leftPanelPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const activeViewport = await viewportPageObject.active;

  // First load
  await leftPanelPageObject.loadSeriesByModality('RTSTRUCT');
  await page.waitForTimeout(5000);

  const loadBadgeCountAfterFirstLoad =
    await DOMOverlayPageObject.viewport.getModalityLoadBadgeCount();
  expect(loadBadgeCountAfterFirstLoad).toBe(0);

  // Navigate to the 12th image. Keyboard navigation is focus-dependent (the
  // arrow presses were landing nowhere here), so jump via the app command
  // and pin the landing slice before capturing.
  await activeViewport.sliceNavigation.toSlice(11);
  await expect(activeViewport.overlayText.bottomRight.instanceNumber).toContainText('I:12');

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.rtHydrationDisableConfirmation.firstLoadPostHydration,
  });

  await rightPanelPageObject.toggle();

  await rightPanelPageObject.noToolsSegmentationPanel.panel.moreMenu.delete();
  await page.waitForTimeout(2000);

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.rtHydrationDisableConfirmation.viewportAfterFirstDelete,
  });

  // Second load
  await leftPanelPageObject.loadSeriesByModality('RTSTRUCT');

  await page.waitForTimeout(5000);

  const loadBadgeCountAfterSecondLoad =
    await DOMOverlayPageObject.viewport.getModalityLoadBadgeCount();
  expect(loadBadgeCountAfterSecondLoad).toBe(0);

  // Same deterministic navigation as the first load.
  await activeViewport.sliceNavigation.toSlice(11);
  await expect(activeViewport.overlayText.bottomRight.instanceNumber).toContainText('I:12');

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.rtHydrationDisableConfirmation.secondLoadPostHydration,
  });

  await rightPanelPageObject.noToolsSegmentationPanel.panel.moreMenu.delete();

  await page.waitForTimeout(2000);

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.rtHydrationDisableConfirmation.viewportAfterSecondDelete,
  });
});
