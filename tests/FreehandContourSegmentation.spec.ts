import { expect, test, visitStudyAndHydrate } from './utils';

const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';

const FIRST_SLICE_OVERLAY = 'I:1 (1/47)';

const dragShape = [
  { x: 0.4, y: 0.4 },
  { x: 0.6, y: 0.4 },
  { x: 0.6, y: 0.6 },
  { x: 0.4, y: 0.6 },
  { x: 0.4, y: 0.4 },
];

test.beforeEach(async ({ page, leftPanelPageObject, DOMOverlayPageObject, viewportPageObject }) => {
  await visitStudyAndHydrate({
    page,
    leftPanelPageObject,
    DOMOverlayPageObject,
    studyInstanceUID,
    modality: 'RTSTRUCT',
  });

  const defaultViewport = await viewportPageObject.getById('default');
  await expect(
    defaultViewport.overlayText.bottomRight.instanceNumber,
    'Expected the hydrated RTSTRUCT to open on slice 1 of 47'
  ).toHaveText(FIRST_SLICE_OVERLAY);
});

test('should keep a freehand contour drawn on slice 1 (no segment pre-selected) after navigating away and back', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const defaultViewport = await viewportPageObject.getById('default');
  const paths = defaultViewport.svg('path');
  const sliceIndicator = defaultViewport.overlayText.bottomRight.instanceNumber;

  await expect(paths, 'Expected the starting number of paths to be 1').toHaveCount(1);
  await rightPanelPageObject.contourSegmentationPanel.tools.freehandContour.click();
  await defaultViewport.normalizedPathDragAt({ path: dragShape });
  await expect(paths, 'Expected the freehand contour to be added on slice 1').toHaveCount(2);

  await rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(1).click();
  await expect(
    sliceIndicator,
    'Expected selecting another segment to navigate off slice 1'
  ).not.toHaveText(FIRST_SLICE_OVERLAY);

  await defaultViewport.sliceNavigation.toFirstSlice();
  await expect(sliceIndicator, 'Expected to scroll back to slice 1').toHaveText(FIRST_SLICE_OVERLAY);
  await expect(paths, 'Expected the freehand contour to persist on slice 1').toHaveCount(2);
});

test('should keep a freehand contour drawn into an added segment after switching segments and back', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const defaultViewport = await viewportPageObject.getById('default');
  const panel = rightPanelPageObject.contourSegmentationPanel.panel;
  const paths = defaultViewport.svg('path');
  const sliceIndicator = defaultViewport.overlayText.bottomRight.instanceNumber;

  await expect(paths, 'Expected the starting number of paths to be 1').toHaveCount(1);
  await expect(sliceIndicator, 'Expected the empty added segment to stay on slice 1').toHaveText(
    FIRST_SLICE_OVERLAY
  );
  await expect(panel.rows, 'Expected 4 segments to start').toHaveCount(4);

  await rightPanelPageObject.contourSegmentationPanel.addSegmentButton.click();
  await expect(panel.rows, 'Expected a new segment row to be added').toHaveCount(5);
  const addedSegment = panel.nthSegment(4);
  await addedSegment.click();

  await rightPanelPageObject.contourSegmentationPanel.tools.freehandContour.click();
  await defaultViewport.normalizedPathDragAt({ path: dragShape });
  await expect(paths, 'Expected the freehand contour to be added to the new segment').toHaveCount(2);

  await panel.nthSegment(0).click();
  await addedSegment.click();
  await expect(
    sliceIndicator,
    'Expected returning to the added segment to land back on slice 1'
  ).toHaveText(FIRST_SLICE_OVERLAY);
  await expect(
    paths,
    'Expected the freehand contour to persist after switching segments'
  ).toHaveCount(2);
});
