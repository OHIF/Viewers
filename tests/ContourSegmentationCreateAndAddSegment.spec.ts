import { expect, test, visitStudy, waitForViewportsRendered } from './utils';
import { expectRowSelected, expectRowNotSelected } from './utils/assertions';

const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';

test.beforeEach(async ({ page, rightPanelPageObject }) => {
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);

  // "Add segmentation" silently does nothing while the viewport is still being
  // registered in the grid, so wait for the first render before interacting.
  await waitForViewportsRendered(page);

  // The segmentation mode opens on the labelmap tab; switch to the contour tab.
  await rightPanelPageObject.contourSegmentationPanel.select();
});

test('should create a new contour segmentation seeded with a default active segment', async ({
  rightPanelPageObject,
}) => {
  const { addSegmentationButton, panel, segmentationSelect } =
    rightPanelPageObject.contourSegmentationPanel;

  // Precondition: no contour segmentation exists yet, so the panel has no segment rows.
  await expect(panel.rows).toHaveCount(0);

  await addSegmentationButton.click();

  // The new segmentation becomes the active selection in the segmentation selector.
  await expect(segmentationSelect.selectedValue).toHaveText('Segmentation 1');

  // The new segmentation is seeded with a single default segment, which is active.
  await expect(panel.rows).toHaveCount(1);
  const defaultSegment = panel.nthSegment(0);
  await expect(defaultSegment.title).toHaveText('Segment 1');
  await expectRowSelected(defaultSegment);
});

test('should add new segments to the active contour segmentation', async ({
  rightPanelPageObject,
}) => {
  const { addSegmentationButton, addSegmentButton, panel } =
    rightPanelPageObject.contourSegmentationPanel;

  await addSegmentationButton.click();
  await expect(panel.rows).toHaveCount(1);

  await addSegmentButton.click();

  const secondSegment = panel.nthSegment(1);
  await expect(panel.rows).toHaveCount(2);
  await expect(secondSegment.title).toHaveText('Segment 2');

  // The newly added segment becomes the active segment in place of the default one.
  await expectRowSelected(secondSegment);
  await expectRowNotSelected(panel.nthSegment(0));

  await addSegmentButton.click();

  const thirdSegment = panel.nthSegment(2);
  await expect(panel.rows).toHaveCount(3);
  await expect(thirdSegment.title).toHaveText('Segment 3');
  await expectRowSelected(thirdSegment);
  await expectRowNotSelected(secondSegment);
});

test('should create and activate a new contour segmentation when an RTSTRUCT segmentation is already hydrated', async ({
  page,
  leftPanelPageObject,
  DOMOverlayPageObject,
  rightPanelPageObject,
}) => {
  const { panel, segmentationSelect } = rightPanelPageObject.contourSegmentationPanel;

  await leftPanelPageObject.loadSeriesByModality('RTSTRUCT');
  await waitForViewportsRendered(page);
  await expect(DOMOverlayPageObject.viewport.segmentationHydration.locator).toBeVisible();
  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();

  // Precondition: the hydrated RTSTRUCT segmentation is active and lists its four segments.
  await expect(panel.rows).toHaveCount(4);

  // With a contour segmentation already present, the "Add segmentation" row is not
  // rendered in collapsed mode; create the new segmentation from the more-menu instead.
  await panel.moreMenu.createNewSegmentation();

  // The new segmentation becomes active: the selector switches to it and the panel
  // shows only its default segment instead of the RTSTRUCT segments.
  await expect(segmentationSelect.selectedValue).toHaveText('Segmentation 2');
  await expect(panel.rows).toHaveCount(1);
  await expect(panel.nthSegment(0).title).toHaveText('Segment 1');
});
