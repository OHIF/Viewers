import { test, visitStudy, expect } from './utils';
import { press } from './utils/keyboardUtils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should keep the viewport rendered when navigating series with Page Down after adding a segmentation', async ({
  page,
  leftPanelPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  // Study has 5 series; pressing 8 times verifies navigation remains stable even after
  // reaching the client-created SEG display set appended by "Add Segmentation".
  const totalPageDownPresses = 8;

  await rightPanelPageObject.labelMapSegmentationPanel.addSegmentationButton.click();

  const thumbnailsLocator = leftPanelPageObject.thumbnails;
  await expect
    .poll(async () => {
      return await thumbnailsLocator.count();
    })
    .toBeGreaterThanOrEqual(5);

  const activeViewport = await viewportPageObject.active;
  await activeViewport.pane.click();
  await activeViewport.pane.dblclick();

  for (let i = 0; i < totalPageDownPresses; i++) {
    await press({ page, key: 'PageDown' });
    const currentActiveViewport = await viewportPageObject.active;
    await expect(currentActiveViewport.overlayText.bottomRight.instanceNumber).toBeVisible();
  }
});
