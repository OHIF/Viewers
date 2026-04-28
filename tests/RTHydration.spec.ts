import { checkForScreenshot, screenShotPaths, test, visitStudy } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should hydrate RT reports correctly', async ({
  page,
  DOMOverlayPageObject,
  leftPanelPageObject,
  rightPanelPageObject,
}) => {
  await rightPanelPageObject.toggle();
  await leftPanelPageObject.loadSeriesByModality('RTSTRUCT');
  await page.waitForTimeout(5000);
  await checkForScreenshot(page, page, screenShotPaths.rtHydration.rtPreHydration);

  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();
  await page.waitForTimeout(5000);
  await checkForScreenshot(page, page, screenShotPaths.rtHydration.rtPostHydration);

  await rightPanelPageObject.labelMapSegmentationPanel.panel.segmentByText('Small Sphere').click();
  await page.waitForTimeout(5000);
  await checkForScreenshot(page, page, screenShotPaths.rtHydration.rtJumpToStructure);
});
