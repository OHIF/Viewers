import { expect, test, visitStudy, visitStudyAndHydrate, waitForViewportsRendered } from './utils';
import { expectRowSelected, expectRowNotSelected } from './utils/assertions';

const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';
test.describe('Contour Segmentation interactions without RTSTRUCT', () => {
  test.beforeEach(async ({ page, rightPanelPageObject }) => {
    await visitStudy(page, studyInstanceUID, 'segmentation', 2000);
    await waitForViewportsRendered(page);
    // Segmentation mode opens on the labelmap tab; switch to the contour tab.
    await rightPanelPageObject.contourSegmentationPanel.select();
  });

  test('should add a contour segmentation from the empty panel', async ({
    rightPanelPageObject,
  }) => {
    const { addSegmentationButton, panel, segmentationSelect } =
      rightPanelPageObject.contourSegmentationPanel;

    // No contour segmentation exists yet.
    await expect(panel.rows).toHaveCount(0);
    await expect(addSegmentationButton.button).toBeVisible();

    await addSegmentationButton.click();

    // The segmentation is added and becomes the active selection.
    await expect(segmentationSelect.selectedValue).toHaveText('Segmentation 1');
    await expect(panel.rows).toHaveCount(1);
  });
});

test.describe('Contour Segmentation interactions on RTSTRUCT', () => {
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

    await expect(panel.rows).toHaveCount(4);

    await panel.moreMenu.createNewSegmentation();

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

  test('should delete every segmentation until none remain', async ({ rightPanelPageObject }) => {
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

  test('should remove a segmentation from the viewport and drop it from the selector', async ({
    rightPanelPageObject,
  }) => {
    const { panel, segmentationSelect } = rightPanelPageObject.contourSegmentationPanel;

    await panel.moreMenu.createNewSegmentation();
    await expect(segmentationSelect.selectedValue).toHaveText('Segmentation 2');

    await panel.moreMenu.removeFromViewport();

    // Removing from the viewport drops it from the selector; the RTSTRUCT one stays active.
    await expect(segmentationSelect.selectedValue).toHaveText('Contours on PET');
    await expect(await segmentationSelect.getSegmentationLabels()).toHaveText(['Contours on PET']);
    await segmentationSelect.close();
  });

  // KNOWN BUG: the last remaining segmentation cannot be removed from the viewport
  // ("Remove from Viewport" is a silent no-op once it is the only one left), so the
  // panel keeps its segment row instead of clearing. Skipped until the bug is fixed.
  test.skip('should remove every segmentation from the viewport', async ({
    rightPanelPageObject,
  }) => {
    const { panel, addSegmentationButton } = rightPanelPageObject.contourSegmentationPanel;

    // Start with the hydrated RTSTRUCT plus two created segmentations.
    await panel.moreMenu.createNewSegmentation();
    await panel.moreMenu.createNewSegmentation();

    // Remove each segmentation from the viewport one by one.
    await panel.moreMenu.removeFromViewport();
    await panel.moreMenu.removeFromViewport();
    await panel.moreMenu.removeFromViewport();

    // The viewport should have no segmentations left: the selector is empty and the
    // "Add segmentation" entry point is shown again.
    await expect(panel.rows).toHaveCount(0);
    await expect(addSegmentationButton.button).toBeVisible();
  });
});
