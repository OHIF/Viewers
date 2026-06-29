import { expect, test, visitStudy, waitForViewportsRendered, getSvgAttribute } from './utils';

const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';


const FIRST_SLICE_OVERLAY= 'I:1 (1/47)';

const dragShape = [
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
  const defaultViewport = await viewportPageObject.getById('default');
  const paths = defaultViewport.svg('path');
  const sliceIndicator = defaultViewport.overlayText.bottomRight.instanceNumber;

  // confirm starting state: slice 1, one contour path (outer box)
  await expect(paths, 'Expected the starting number of paths to be 1').toHaveCount(1);
  await rightPanelPageObject.contourSegmentationPanel.tools.freehand.click();
  // Freehand auto-closes on mouse-up; the drag traces the loop.
  await defaultViewport.normalizedPathDragAt({ path: dragShape });
  // Confirm that the freehand contour was added to the viewport on slice 1
  await expect(paths, 'Expected the freehand contour to be added on slice 1').toHaveCount(2);

  // Capture the drawn contour's geometry.
  const drawnPathD = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
    nth: 1,
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
  await defaultViewport.sliceNavigation.toFirstSlice();
  await waitForViewportsRendered(page);
  await expect(sliceIndicator, 'Expected to scroll back to slice 1').toHaveText(FIRST_SLICE_OVERLAY);

  const persistedPathD = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
    nth: 1,
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
  const defaultViewport = await viewportPageObject.getById('default');
  const panel = rightPanelPageObject.contourSegmentationPanel.panel;
  const paths = defaultViewport.svg('path');
  const sliceIndicator = defaultViewport.overlayText.bottomRight.instanceNumber;

  // confirm starting state: one contour path (outer box), 1/47 overlay and 4 panel segments
  await expect(paths, 'Expected the starting number of paths to be 1').toHaveCount(1);
  await expect(sliceIndicator, 'Expected the empty added segment to stay on slice 1').toHaveText(
    FIRST_SLICE_OVERLAY
  );
  await expect(panel.rows, 'Expected 4 segments to start').toHaveCount(4);


  // Add a fresh segment and make it the active drawing target.
  await rightPanelPageObject.contourSegmentationPanel.addSegmentButton.click();
  await expect(panel.rows, 'Expected a new segment row to be added').toHaveCount(5);
  const addedSegment = panel.nthSegment(4); // The newly added segment is at index 4.
  await addedSegment.click();

  // Draw a freehand contour into the added segment on slice 1.
  await rightPanelPageObject.contourSegmentationPanel.tools.freehand.click();
  await defaultViewport.normalizedPathDragAt({ path: dragShape });
  await expect(paths, 'Expected the freehand contour to be added to the new segment').toHaveCount(2);

  // Capture the drawn contour's geometry.
  const drawnPathD = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
    nth: 1,
  });
  expect(drawnPathD, 'Expected the drawn freehand contour to render an SVG path').not.toBeNull();

  // Switch to another segment (jumps to its slice), then come back to the added segment.
  await panel.nthSegment(0).click();

  await addedSegment.click();
  await expect(
    sliceIndicator,
    'Expected returning to the added segment to land back on slice 1'
  ).toHaveText(FIRST_SLICE_OVERLAY);

  const persistedPathD = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
    nth: 1,
  });
  expect(persistedPathD, 'Expected the freehand contour to still render on slice 1').not.toBeNull();
  expect(persistedPathD, 'Expected the persisted freehand contour to match what was drawn').toBe(
    drawnPathD
  );
});

test('should keep a spline contour drawn on slice 1 (no segment pre-selected) after navigating away and back', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const defaultViewport = await viewportPageObject.getById('default');
  const paths = defaultViewport.svg('path');
  const sliceIndicator = defaultViewport.overlayText.bottomRight.instanceNumber;

  // confirm starting state: slice 1, one contour path (outer box)
  await expect(paths, 'Expected the starting number of paths to be 1').toHaveCount(1);
  await rightPanelPageObject.contourSegmentationPanel.tools.spline.click();
  // Click the vertices then re-click the first vertex to close the contour.
  await defaultViewport.normalizedClickAt(dragShape);
  // Confirm that the spline contour was added to the viewport on slice 1
  await expect(paths, 'Expected the spline contour to be added on slice 1').toHaveCount(2);

  // Capture the drawn contour's geometry.
  const drawnPathD = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
    nth: 1,
  });
  expect(drawnPathD, 'Expected the drawn spline contour to render an SVG path').not.toBeNull();

  // Selecting another segment jumps the viewport to that segment's slice,
  // navigating away from slice 1.
  await rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(1).click();
  await expect(
    sliceIndicator,
    'Expected selecting another segment to navigate off slice 1'
  ).not.toHaveText(FIRST_SLICE_OVERLAY);

  // Scroll back to slice 1 — the spline contour must still render, unchanged.
  // The spline tool stays active after drawing, so wait on DOM state (overlay +
  // re-rendered path) rather than viewport render status, which never settles.
  await defaultViewport.sliceNavigation.toFirstSlice();
  await expect(sliceIndicator, 'Expected to scroll back to slice 1').toHaveText(FIRST_SLICE_OVERLAY);
  await expect(paths, 'Expected the spline contour to re-render on slice 1').toHaveCount(2);

  const persistedPathD = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
    nth: 1,
  });
  expect(persistedPathD, 'Expected the spline contour to still render on slice 1').not.toBeNull();
  expect(persistedPathD, 'Expected the persisted spline contour to match what was drawn').toBe(
    drawnPathD
  );
});

test('should keep a spline contour drawn into an added segment after switching segments and back', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const defaultViewport = await viewportPageObject.getById('default');
  const panel = rightPanelPageObject.contourSegmentationPanel.panel;
  const paths = defaultViewport.svg('path');
  const sliceIndicator = defaultViewport.overlayText.bottomRight.instanceNumber;

  // confirm starting state: one contour path (outer box), 1/47 overlay and 4 panel segments
  await expect(paths, 'Expected the starting number of paths to be 1').toHaveCount(1);
  await expect(sliceIndicator, 'Expected the empty added segment to stay on slice 1').toHaveText(
    FIRST_SLICE_OVERLAY
  );
  await expect(panel.rows, 'Expected 4 segments to start').toHaveCount(4);

  // Add a fresh segment and make it the active drawing target.
  await rightPanelPageObject.contourSegmentationPanel.addSegmentButton.click();
  await expect(panel.rows, 'Expected a new segment row to be added').toHaveCount(5);
  const addedSegment = panel.nthSegment(4); // The newly added segment is at index 4.
  await addedSegment.click();

  // Draw a spline contour into the added segment on slice 1.
  await rightPanelPageObject.contourSegmentationPanel.tools.spline.click();
  await defaultViewport.normalizedClickAt(dragShape);
  await expect(paths, 'Expected the spline contour to be added to the new segment').toHaveCount(2);

  // Capture the drawn contour's geometry.
  const drawnPathD = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
    nth: 1,
  });
  expect(drawnPathD, 'Expected the drawn spline contour to render an SVG path').not.toBeNull();

  // Switch to another segment (jumps to its slice), then come back to the added segment.
  await panel.nthSegment(0).click();

  await addedSegment.click();
  await expect(
    sliceIndicator,
    'Expected returning to the added segment to land back on slice 1'
  ).toHaveText(FIRST_SLICE_OVERLAY);

  const persistedPathD = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
    nth: 1,
  });
  expect(persistedPathD, 'Expected the spline contour to still render on slice 1').not.toBeNull();
  expect(persistedPathD, 'Expected the persisted spline contour to match what was drawn').toBe(
    drawnPathD
  );
});

test('should keep a livewire contour drawn on slice 1 (no segment pre-selected) after navigating away and back', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const defaultViewport = await viewportPageObject.getById('default');
  const paths = defaultViewport.svg('path');
  const sliceIndicator = defaultViewport.overlayText.bottomRight.instanceNumber;

  // confirm starting state: slice 1, one contour path (outer box)
  await expect(paths, 'Expected the starting number of paths to be 1').toHaveCount(1);
  await rightPanelPageObject.contourSegmentationPanel.tools.livewire.click();
  // Click the vertices then re-click the first vertex to close the contour.
  await defaultViewport.normalizedClickAt(dragShape);
  // Confirm that the livewire contour was added to the viewport on slice 1
  await expect(paths, 'Expected the livewire contour to be added on slice 1').toHaveCount(2);

  // Capture the drawn contour's geometry.
  const drawnPathD = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
    nth: 1,
  });
  expect(drawnPathD, 'Expected the drawn livewire contour to render an SVG path').not.toBeNull();

  // Selecting another segment jumps the viewport to that segment's slice,
  // navigating away from slice 1.
  await rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(1).click();
  await expect(
    sliceIndicator,
    'Expected selecting another segment to navigate off slice 1'
  ).not.toHaveText(FIRST_SLICE_OVERLAY);

  // Scroll back to slice 1 — the livewire contour must still render, unchanged.
  // The livewire tool stays active after drawing, so wait on DOM state (overlay +
  // re-rendered path) rather than viewport render status, which never settles.
  await defaultViewport.sliceNavigation.toFirstSlice();
  await expect(sliceIndicator, 'Expected to scroll back to slice 1').toHaveText(FIRST_SLICE_OVERLAY);
  await expect(paths, 'Expected the livewire contour to re-render on slice 1').toHaveCount(2);

  const persistedPathD = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
    nth: 1,
  });
  expect(persistedPathD, 'Expected the livewire contour to still render on slice 1').not.toBeNull();
  expect(persistedPathD, 'Expected the persisted livewire contour to match what was drawn').toBe(
    drawnPathD
  );
});

test('should keep a livewire contour drawn into an added segment after switching segments and back', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const defaultViewport = await viewportPageObject.getById('default');
  const panel = rightPanelPageObject.contourSegmentationPanel.panel;
  const paths = defaultViewport.svg('path');
  const sliceIndicator = defaultViewport.overlayText.bottomRight.instanceNumber;

  // confirm starting state: one contour path (outer box), 1/47 overlay and 4 panel segments
  await expect(paths, 'Expected the starting number of paths to be 1').toHaveCount(1);
  await expect(sliceIndicator, 'Expected the empty added segment to stay on slice 1').toHaveText(
    FIRST_SLICE_OVERLAY
  );
  await expect(panel.rows, 'Expected 4 segments to start').toHaveCount(4);


  // Add a fresh segment and make it the active drawing target.
  await rightPanelPageObject.contourSegmentationPanel.addSegmentButton.click();
  await expect(panel.rows, 'Expected a new segment row to be added').toHaveCount(5);
  const addedSegment = panel.nthSegment(4); // The newly added segment is at index 4.
  await addedSegment.click();

  // Draw a livewire contour into the added segment on slice 1.
  await rightPanelPageObject.contourSegmentationPanel.tools.livewire.click();
  await defaultViewport.normalizedClickAt(dragShape);
  await expect(paths, 'Expected the livewire contour to be added to the new segment').toHaveCount(2);

  // Capture the drawn contour's geometry.
  const drawnPathD = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
    nth: 1,
  });
  expect(drawnPathD, 'Expected the drawn livewire contour to render an SVG path').not.toBeNull();

  // Switch to another segment (jumps to its slice), then come back to the added segment.
  await panel.nthSegment(0).click();

  await addedSegment.click();
  await expect(
    sliceIndicator,
    'Expected returning to the added segment to land back on slice 1'
  ).toHaveText(FIRST_SLICE_OVERLAY);

  const persistedPathD = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
    nth: 1,
  });
  expect(persistedPathD, 'Expected the livewire contour to still render on slice 1').not.toBeNull();
  expect(persistedPathD, 'Expected the persisted livewire contour to match what was drawn').toBe(
    drawnPathD
  );
});
