import { expect, test, visitStudyAndHydrate } from './utils';
import { expectRowSelected } from './utils/assertions';

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
