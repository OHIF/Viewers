import { expect, test, visitStudyAndHydrate } from './utils';
import { expectRowSelected, expectRowNotSelected } from './utils/assertions';

const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';

test.beforeEach(async ({ page, leftPanelPageObject, DOMOverlayPageObject }) => {
  await visitStudyAndHydrate({
    page,
    leftPanelPageObject,
    DOMOverlayPageObject,
    studyInstanceUID,
    modality: 'RTSTRUCT',
  });
});

test('should create a new contour segmentation seeded with a default active segment', async ({
  rightPanelPageObject,
}) => {
  const { panel, segmentationSelect } = rightPanelPageObject.contourSegmentationPanel;

  // The hydrated RTSTRUCT segmentation is active with its four segments.
  await expect(panel.rows).toHaveCount(4);

  // "Add segmentation" is hidden once a segmentation exists, so use the more-menu.
  await panel.moreMenu.createNewSegmentation();

  // The new segmentation becomes active, seeded with a single default active segment.
  await expect(segmentationSelect.selectedValue).toHaveText('Segmentation 2');
  await expect(panel.rows).toHaveCount(1);
  const defaultSegment = panel.nthSegment(0);
  await expect(defaultSegment.title).toHaveText('Segment 1');
  await expectRowSelected(defaultSegment);
});

test('should add multiple segments to a newly created contour segmentation', async ({
  rightPanelPageObject,
}) => {
  const { panel, addSegmentButton } = rightPanelPageObject.contourSegmentationPanel;

  await panel.moreMenu.createNewSegmentation();
  await expect(panel.rows).toHaveCount(1);

  // Each added segment becomes the active one in place of the previous.
  await addSegmentButton.click();
  await expect(panel.rows).toHaveCount(2);
  await expectRowSelected(panel.nthSegment(1));
  await expectRowNotSelected(panel.nthSegment(0));

  await addSegmentButton.click();
  await expect(panel.rows).toHaveCount(3);
  await expectRowSelected(panel.nthSegment(2));
  await expectRowNotSelected(panel.nthSegment(1));

  await expect(panel.getSegmentLabels()).toHaveText(['Segment 1', 'Segment 2', 'Segment 3']);
});

test('should list every created segmentation in the segmentation selector', async ({
  rightPanelPageObject,
}) => {
  const { panel, segmentationSelect } = rightPanelPageObject.contourSegmentationPanel;

  // Only the hydrated RTSTRUCT segmentation exists at first.
  await expect(await segmentationSelect.getSegmentationLabels()).toHaveText(['Contours on PET']);
  await segmentationSelect.close();

  await panel.moreMenu.createNewSegmentation();
  await panel.moreMenu.createNewSegmentation();

  // The two newly created segmentations are added to the selector.
  await expect(await segmentationSelect.getSegmentationLabels()).toHaveText([
    'Contours on PET',
    'Segmentation 2',
    'Segmentation 3',
  ]);
  await segmentationSelect.close();
});

test('should switch between segmentations and show the matching segments', async ({
  rightPanelPageObject,
}) => {
  const { panel, segmentationSelect } = rightPanelPageObject.contourSegmentationPanel;

  // Create a second segmentation alongside the hydrated RTSTRUCT one.
  await panel.moreMenu.createNewSegmentation();
  await expect(segmentationSelect.selectedValue).toHaveText('Segmentation 2');
  await expect(panel.rows).toHaveCount(1);

  // Switching to the RTSTRUCT segmentation shows its four segments.
  await segmentationSelect.selectNthSegmentation(0);
  await expect(segmentationSelect.selectedValue).toHaveText('Contours on PET');
  await expect(panel.rows).toHaveCount(4);
  await expect(panel.getSegmentLabels().filter({ hasText: 'Threshold' })).toHaveCount(1);

  // Switching back to the created segmentation shows only its default segment.
  await segmentationSelect.selectNthSegmentation(1);
  await expect(segmentationSelect.selectedValue).toHaveText('Segmentation 2');
  await expect(panel.rows).toHaveCount(1);
  await expect(panel.nthSegment(0).title).toHaveText('Segment 1');
});

test('should rename a segmentation and reflect the new name in the selector', async ({
  rightPanelPageObject,
}) => {
  const { panel, segmentationSelect } = rightPanelPageObject.contourSegmentationPanel;

  await panel.moreMenu.createNewSegmentation();
  await expect(segmentationSelect.selectedValue).toHaveText('Segmentation 2');

  await panel.moreMenu.rename('Renamed Segmentation');

  await expect(segmentationSelect.selectedValue).toHaveText('Renamed Segmentation');
  await expect(await segmentationSelect.getSegmentationLabels()).toHaveText([
    'Contours on PET',
    'Renamed Segmentation',
  ]);
  await segmentationSelect.close();
});

test('should not rename a segmentation when the rename dialog is cancelled', async ({
  rightPanelPageObject,
}) => {
  const { panel, segmentationSelect } = rightPanelPageObject.contourSegmentationPanel;

  await panel.moreMenu.createNewSegmentation();
  await expect(segmentationSelect.selectedValue).toHaveText('Segmentation 2');

  // Cancelling with an untouched dialog leaves the name unchanged.
  await panel.moreMenu.cancelRename();
  await expect(segmentationSelect.selectedValue).toHaveText('Segmentation 2');

  // Cancelling after typing a new name also discards it.
  await panel.moreMenu.cancelRename('Discarded Name');
  await expect(segmentationSelect.selectedValue).toHaveText('Segmentation 2');
});

test('should delete a segmentation and remove it from the selector', async ({
  rightPanelPageObject,
}) => {
  const { panel, segmentationSelect } = rightPanelPageObject.contourSegmentationPanel;

  await panel.moreMenu.createNewSegmentation();
  await expect(segmentationSelect.selectedValue).toHaveText('Segmentation 2');

  await panel.moreMenu.delete();

  // The remaining RTSTRUCT segmentation becomes active and is the only one left.
  await expect(segmentationSelect.selectedValue).toHaveText('Contours on PET');
  await expect(await segmentationSelect.getSegmentationLabels()).toHaveText(['Contours on PET']);
  await segmentationSelect.close();
});

test('should delete every segmentation until none remain', async ({
  rightPanelPageObject,
}) => {
  const { panel, addSegmentationButton } = rightPanelPageObject.contourSegmentationPanel;

  // Start with the hydrated RTSTRUCT plus two created segmentations.
  await panel.moreMenu.createNewSegmentation();
  await panel.moreMenu.createNewSegmentation();

  // Delete each of the three segmentations one by one.
  await panel.moreMenu.delete();
  await panel.moreMenu.delete();
  await panel.moreMenu.delete();

  // No segmentation remains, so the panel has no segment rows and the
  // "Add segmentation" entry point is shown again.
  await expect(panel.rows).toHaveCount(0);
  await expect(addSegmentationButton.button).toBeVisible();
});
