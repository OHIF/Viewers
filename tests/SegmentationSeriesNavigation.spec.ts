import { test, visitStudy, expect } from './utils';
import { press } from './utils/keyboardUtils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should keep the viewport rendered when navigating series with Page Down after adding a segmentation', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const totalPageDownPresses = 6;

  await rightPanelPageObject.labelMapSegmentationPanel.addSegmentationButton.click();

  await viewportPageObject.active.pane.click();
  await viewportPageObject.active.pane.dblclick();

  for (let i = 0; i < totalPageDownPresses; i++) {
    await press({ page, key: 'PageDown' });

    const viewportInfoBottomRight =
      viewportPageObject.active.overlayText.bottomRight.instanceNumber;
    await expect(viewportInfoBottomRight).toBeVisible();
  }
});
