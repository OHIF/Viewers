import { expect, test, visitStudy } from './utils';

const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';

test.beforeEach(async ({
  page,
  leftPanelPageObject,
  DOMOverlayPageObject
}) => {
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);
  await leftPanelPageObject.loadSeriesByModality('RTSTRUCT');
  await page.waitForTimeout(5000);
  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();
});

test('should rename contour segments', async ({
  rightPanelPageObject,
}) => {
  const segment0 = rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(0);
  const segment1 = rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(1);

  const originalName0 = await segment0.title.textContent();
  const originalName1 = await segment1.title.textContent();
  expect(originalName0, 'Expected segment 0 to have a non-empty original name').toBeTruthy();
  expect(originalName1, 'Expected segment 1 to have a non-empty original name').toBeTruthy();

  await segment0.actions.rename('Renamed Segment');
  await segment1.actions.rename('Seg-2 (updated) / v2.0 #$^&&@*!!');

  await expect(segment0.locator).toContainText('Renamed Segment');
  await expect(segment0.locator).not.toContainText(originalName0!);

  await expect(segment1.locator).toContainText('Seg-2 (updated) / v2.0 #$^&&@*!!');
  await expect(segment1.locator).not.toContainText(originalName1!);
});

test('should not rename when dialog is cancelled without filling', async ({
  rightPanelPageObject,
}) => {
  const segment = rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(0);
  const originalName = await segment.title.textContent();
  expect(originalName, 'Expected segment 0 to have a non-empty original name').toBeTruthy();

  await segment.actions.cancelRename();

  await expect(segment.locator).toContainText(originalName!);
});

test('should not rename when dialog is cancelled after filling', async ({
  rightPanelPageObject,
}) => {
  const segment = rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(0);
  const originalName = await segment.title.textContent();
  expect(originalName, 'Expected segment 0 to have a non-empty original name').toBeTruthy();

  await segment.actions.cancelRename('Do Not Persist');

  await expect(segment.locator).toContainText(originalName!);
  await expect(segment.locator).not.toContainText('Do Not Persist');
});
