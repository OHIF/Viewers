import {
  checkForScreenshot,
  expect,
  screenShotPaths,
  test,
  visitStudy,
  waitForViewportsRendered,
} from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';
  await visitStudy(page, studyInstanceUID, 'viewer', 2000);
});

test('keeps the source images visible after deleting a non-hydrated RTSTRUCT', async ({
  page,
  DOMOverlayPageObject,
  leftPanelPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await leftPanelPageObject.loadSeriesByModality('RTSTRUCT');
  await expect(DOMOverlayPageObject.viewport.segmentationHydration.locator).toBeVisible();
  await DOMOverlayPageObject.viewport.segmentationHydration.no.click();

  const activeViewport = await viewportPageObject.active;
  await expect(activeViewport.pane.locator('canvas')).toBeVisible({ timeout: 15_000 });

  // Use a representative middle slice so the retained source image is visually unambiguous.
  await activeViewport.sliceNavigation.toSlice(23);
  await waitForViewportsRendered(page);

  await rightPanelPageObject.toggle();
  await rightPanelPageObject.noToolsSegmentationPanel.select();

  await rightPanelPageObject.noToolsSegmentationPanel.panel.moreMenu.delete();
  await expect(rightPanelPageObject.noToolsSegmentationPanel.panel.rows).toHaveCount(0);
  await checkForScreenshot({
    page,
    locator: activeViewport.pane,
    screenshotPath: screenShotPaths.rtNonHydratedDelete.viewportAfterDelete,
  });
});
