import { expect, press, test, visitStudyAndHydrate } from './utils';

const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';
const defautSegment0Name = 'Threshold';
const defautSegment1Name = 'Big Sphere';

test.beforeEach(async ({ page, leftPanelPageObject, DOMOverlayPageObject }) => {
  await visitStudyAndHydrate({
    page,
    leftPanelPageObject,
    DOMOverlayPageObject,
    studyInstanceUID,
    modality: 'RTSTRUCT',
  });
});

test('should rename contour segments', async ({ rightPanelPageObject }) => {
  const segment0 = rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(0);
  const segment1 = rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(1);

  await expect(segment0.title).toHaveText(defautSegment0Name);
  await expect(segment1.title).toHaveText(defautSegment1Name);

  await segment0.actions.rename('Renamed Segment');
  await segment1.actions.rename('Seg-2 (updated) / v2.0 #$^&&@*!!');

  await expect(segment0.title).toHaveText('Renamed Segment');

  await expect(segment1.title).toHaveText('Seg-2 (updated) / v2.0 #$^&&@*!!');
});

test('should not rename segment when dialog is cancelled without filling', async ({
  rightPanelPageObject,
}) => {
  const segment = rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(0);
  await expect(segment.title).toHaveText(defautSegment0Name);

  await segment.actions.cancelRename();

  await expect(segment.title).toHaveText(defautSegment0Name);
});

test('should not rename segment when dialog is cancelled after filling', async ({
  rightPanelPageObject,
}) => {
  const segment = rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(0);

  await expect(segment.title).toHaveText(defautSegment0Name);

  await segment.actions.cancelRename('Do Not Persist');

  await expect(segment.title).toHaveText(defautSegment0Name);
});

// Expected to fail until https://github.com/OHIF/Viewers/issues/5781 is fixed
// is not recorded in the undo history, so undo stays disabled.
test.fail(
  'should undo and redo a segment rename',
  async ({ page, mainToolbarPageObject, rightPanelPageObject }) => {
    const segment = rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(0);
    await expect(segment.title).toHaveText(defautSegment0Name);

    await segment.actions.rename('Renamed Segment');
    await expect(segment.title).toHaveText('Renamed Segment');
    await expect(mainToolbarPageObject.undo.button).toBeEnabled();

    await press({ page, key: 'Control+z' });
    await expect(segment.title).toHaveText(defautSegment0Name);

    await press({ page, key: 'Control+y' });
    await expect(segment.title).toHaveText('Renamed Segment');
  }
);
