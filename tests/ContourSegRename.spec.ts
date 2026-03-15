import { expect, test, visitStudy } from './utils';

const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';
const defautSegment0Name = 'Threshold';
const defautSegment1Name = 'Big Sphere';

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

  await expect(segment0.title).toHaveText(defautSegment0Name);
  await expect(segment1.title).toHaveText(defautSegment1Name);

  await segment0.actions.rename('Renamed Segment');
  await segment1.actions.rename('Seg-2 (updated) / v2.0 #$^&&@*!!');

  await expect(segment0.title).toHaveText('Renamed Segment');

  await expect(segment1.title).toHaveText('Seg-2 (updated) / v2.0 #$^&&@*!!');
});

test('should not rename when dialog is cancelled without filling', async ({
  rightPanelPageObject,
}) => {
  const segment = rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(0);
  await expect(segment.title).toHaveText(defautSegment0Name);

  await segment.actions.cancelRename();

  await expect(segment.title).toHaveText(defautSegment0Name);
});

test('should not rename when dialog is cancelled after filling', async ({
  rightPanelPageObject,
}) => {
  const segment = rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(0);

  await expect(segment.title).toHaveText(defautSegment0Name);

  await segment.actions.cancelRename('Do Not Persist');

  await expect(segment.title).toHaveText(defautSegment0Name);
});
