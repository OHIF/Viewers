import { expect, test, visitStudy, waitForViewportsRendered, getSvgAttribute } from './utils';

const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';


const FIRST_SLICE_OVERLAY= 'I:1 (1/47)';

// A closed loop in the centre of the viewport, clear of the hydrated RTSTRUCT
// contour so a freshly drawn contour renders as its own SVG <path>.
const loop = [
  { x: 0.4, y: 0.4 },
  { x: 0.6, y: 0.4 },
  { x: 0.6, y: 0.6 },
  { x: 0.4, y: 0.6 },
  { x: 0.4, y: 0.4 },
];

test.beforeEach(async ({ page, leftPanelPageObject, DOMOverlayPageObject, viewportPageObject }) => {
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);

  await leftPanelPageObject.loadSeriesByModality('RTSTRUCT');
  await waitForViewportsRendered(page);
  await expect(DOMOverlayPageObject.viewport.segmentationHydration.locator).toBeVisible();

  // Hydrating the RTSTRUCT gives an active Contour segmentation with segments,
  // which is what enables the contour drawing tools in the panel toolbox.
  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();

  // Hydration parks the viewport on the first slice; the drawing tests below
  // rely on starting from slice 1.
  const defaultViewport = await viewportPageObject.getById('default');
  await expect(
    defaultViewport.overlayText.bottomRight.instanceNumber,
    'Expected the hydrated RTSTRUCT to open on slice 1 of 47'
  ).toHaveText(FIRST_SLICE_OVERLAY);
});

test('should keep a freehand contour drawn on slice 1 (no segment pre-selected) after navigating away and back', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const activeViewport = await viewportPageObject.active;
  const defaultViewport = await viewportPageObject.getById('default');
  const paths = defaultViewport.svg('path');
  const sliceIndicator = defaultViewport.overlayText.bottomRight.instanceNumber;


  const drawnIndex = await paths.count();
  await rightPanelPageObject.contourSegmentationPanel.tools.freehand.click();
  // Freehand auto-closes on mouse-up; the drag traces the loop.
  await activeViewport.normalizedPathDragAt({ path: loop, config: { steps: 20, delay: 30 } });
  await expect(paths, 'Expected the freehand contour to be added on slice 1').toHaveCount(
    drawnIndex + 1
  );

  // Capture the drawn contour's geometry.
  const drawnPathD = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
    nth: drawnIndex,
  });
  expect(drawnPathD, 'Expected the drawn freehand contour to render an SVG path').not.toBeNull();

  // Selecting another segment jumps the viewport to that segment's slice,
  // navigating away from slice 1.
  await rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(1).click();
  await expect(
    sliceIndicator,
    'Expected selecting another segment to navigate off slice 1'
  ).not.toHaveText(FIRST_SLICE_OVERLAY);

  // Scroll back to slice 1 — the freehand contour must still render, unchanged.
  await activeViewport.sliceNavigation.toFirstSlice();
  await waitForViewportsRendered(page);
  await expect(sliceIndicator, 'Expected to scroll back to slice 1').toHaveText(FIRST_SLICE_OVERLAY);

  const persistedPathD = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
    nth: drawnIndex,
  });
  expect(persistedPathD, 'Expected the freehand contour to still render on slice 1').not.toBeNull();
  expect(persistedPathD, 'Expected the persisted freehand contour to match what was drawn').toBe(
    drawnPathD
  );
});

test('should keep a freehand contour drawn into an added segment after switching segments and back', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const activeViewport = await viewportPageObject.active;
  const defaultViewport = await viewportPageObject.getById('default');
  const panel = rightPanelPageObject.contourSegmentationPanel.panel;
  const paths = defaultViewport.svg('path');
  const sliceIndicator = defaultViewport.overlayText.bottomRight.instanceNumber;

  // Add a fresh segment and make it the active drawing target. It is empty, so
  // selecting it keeps us on slice 1.
  const initialCount = await panel.getSegmentCount();
  await rightPanelPageObject.contourSegmentationPanel.addSegmentButton.click();
  await expect(panel.rows, 'Expected a new segment row to be added').toHaveCount(initialCount + 1);
  const addedSegment = panel.nthSegment(initialCount);
  await addedSegment.click();
  await expect(sliceIndicator, 'Expected the empty added segment to stay on slice 1').toHaveText(
    FIRST_SLICE_OVERLAY
  );

  // Draw a freehand contour into the added segment on slice 1.
  const drawnIndex = await paths.count();
  await rightPanelPageObject.contourSegmentationPanel.tools.freehand.click();
  await activeViewport.normalizedPathDragAt({ path: loop, config: { steps: 20, delay: 30 } });
  await expect(paths, 'Expected the freehand contour to be added to the new segment').toHaveCount(
    drawnIndex + 1
  );

  // Capture the drawn contour's geometry.
  const drawnPathD = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
    nth: drawnIndex,
  });
  expect(drawnPathD, 'Expected the drawn freehand contour to render an SVG path').not.toBeNull();

  // Switch to another segment (jumps to its slice), then come back to the added segment.
  await panel.nthSegment(0).click();
  await expect(
    sliceIndicator,
    'Expected switching segments to navigate off slice 1'
  ).not.toHaveText(FIRST_SLICE_OVERLAY);

  await addedSegment.click();
  await waitForViewportsRendered(page);
  await expect(
    sliceIndicator,
    'Expected returning to the added segment to land back on slice 1'
  ).toHaveText(FIRST_SLICE_OVERLAY);

  const persistedPathD = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
    nth: drawnIndex,
  });
  expect(persistedPathD, 'Expected the freehand contour to still render on slice 1').not.toBeNull();
  expect(persistedPathD, 'Expected the persisted freehand contour to match what was drawn').toBe(
    drawnPathD
  );
});

test('should draw a new contour with the Spline contour tool', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const activeViewport = await viewportPageObject.active;
  const paths = (await viewportPageObject.getById('default')).svg('path');

  await expect(paths, 'Expected the hydrated RTSTRUCT to render a single contour').toHaveCount(1);

  await rightPanelPageObject.contourSegmentationPanel.tools.spline.click();

  // Click the vertices then re-click the first vertex to close the contour.
  await activeViewport.normalizedClickAt(loop);

  await expect(paths, 'Expected a newly drawn spline contour path to appear').toHaveCount(2);
});

test('should draw a new contour with the Livewire contour tool', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const activeViewport = await viewportPageObject.active;
  const paths = (await viewportPageObject.getById('default')).svg('path');

  await expect(paths, 'Expected the hydrated RTSTRUCT to render a single contour').toHaveCount(1);

  await rightPanelPageObject.contourSegmentationPanel.tools.livewire.click();

  await activeViewport.normalizedClickAt(loop);

  await expect(paths, 'Expected a newly drawn livewire contour path to appear').toHaveCount(2);
});
