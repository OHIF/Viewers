import {
  checkForViewportScreenshot,
  expect,
  getSvgAttribute,
  screenShotPaths,
  test,
  visitStudy,
  waitForViewportsRendered,
  withKeyHeld,
} from './utils';

const studyInstanceUID = '1.3.12.2.1107.5.2.32.35162.30000015050317233592200000046';
const mode = 'segmentation';

const dragShape = [
  { x: 0.4, y: 0.4 },
  { x: 0.6, y: 0.4 },
  { x: 0.6, y: 0.6 },
  { x: 0.4, y: 0.6 },
  { x: 0.4, y: 0.4 },
];

const secondDragShape = [
  { x: 0.65, y: 0.15 },
  { x: 0.85, y: 0.15 },
  { x: 0.85, y: 0.35 },
  { x: 0.65, y: 0.35 },
  { x: 0.65, y: 0.15 },
];

const overlappingDragShape = [
  { x: 0.5, y: 0.5 },
  { x: 0.7, y: 0.5 },
  { x: 0.7, y: 0.7 },
  { x: 0.5, y: 0.7 },
  { x: 0.5, y: 0.5 },
];

// Fully inside dragShape, so a Shift stroke cuts a hole instead of carving an edge.
const holeDragShape = [
  { x: 0.45, y: 0.45 },
  { x: 0.55, y: 0.45 },
  { x: 0.55, y: 0.55 },
  { x: 0.45, y: 0.55 },
  { x: 0.45, y: 0.45 },
];

test.beforeEach(async ({ page, rightPanelPageObject }) => {
  await visitStudy(page, studyInstanceUID, mode, 2000);
  await waitForViewportsRendered(page);

  const contourPanel = rightPanelPageObject.contourSegmentationPanel;
  await contourPanel.addSegmentation();
  await expect(contourPanel.panel.rows, 'Expected the default segment row').toHaveCount(1);
  await waitForViewportsRendered(page);
});

test('should keep a freehand contour drawn on a slice after navigating away and back', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const activeViewport = await viewportPageObject.active;
  const paths = activeViewport.svg('path');

  //Force navigate to first slice
  await activeViewport.sliceNavigation.toFirstSlice();
  await waitForViewportsRendered(page);

  const sliceIndicator = activeViewport.overlayText.bottomRight.instanceNumber;
  const drawingSliceInfo = await sliceIndicator.innerText();

  await expect(paths, 'Expected the starting number of paths to be 0').toHaveCount(0);
  await rightPanelPageObject.contourSegmentationPanel.tools.freehandContour.click();
  await activeViewport.normalizedPathDragAt({ path: dragShape });
  await expect(paths, 'Expected the contour to be added on the drawing slice').toHaveCount(1);
  await expect(paths.nth(0), 'Expected the drawn contour to be visible').toBeVisible();

  const drawnPathD = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
    nth: 0,
  });
  expect(drawnPathD, 'Expected the drawn freehand contour to render an SVG path').not.toBeNull();

  //Navigate to last slice
  await activeViewport.sliceNavigation.toLastSlice();
  await waitForViewportsRendered(page);
  await expect(sliceIndicator, 'Expected to leave drawing slice').not.toHaveText(drawingSliceInfo);
  await expect(paths, 'Expected no contour on the other slice').toHaveCount(0);

  // Come back to first slice
  await activeViewport.sliceNavigation.toFirstSlice();
  await waitForViewportsRendered(page);
  await expect(sliceIndicator, 'Expected to return to drawing slice').toHaveText(drawingSliceInfo);
  await expect(paths, 'Expected the contour to re-render on the drawing slice').toHaveCount(1);
  await expect(paths.nth(0), 'Expected the persisted contour to be visible').toBeVisible();

  const persistedPathD = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
    nth: 0,
  });
  expect(persistedPathD, 'Expected the persisted contour to render an SVG path').not.toBeNull();
  expect(persistedPathD, 'Expected the persisted contour to match the drawn one').toBe(drawnPathD);
});

test('should keep distinct freehand contours drawn into the same segment separate', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const activeViewport = await viewportPageObject.active;
  const panel = rightPanelPageObject.contourSegmentationPanel.panel;
  const paths = activeViewport.svg('path');

  await expect(paths, 'Expected the starting number of paths to be 0').toHaveCount(0);

  await rightPanelPageObject.contourSegmentationPanel.addSegmentButton.click();
  await expect(panel.rows, 'Expected a new segment row to be added').toHaveCount(2);
  const addedSegment = panel.nthSegment(1);
  await addedSegment.click();
  await waitForViewportsRendered(page);

  await rightPanelPageObject.contourSegmentationPanel.tools.freehandContour.click();
  await activeViewport.normalizedPathDragAt({ path: dragShape });
  await expect(paths, 'Expected the first freehand contour to be added').toHaveCount(1);

  await activeViewport.normalizedPathDragAt({ path: secondDragShape });
  await expect(paths, 'Expected both freehand contours to render separately').toHaveCount(2);
  await expect(paths.nth(0), 'Expected the first freehand contour to be visible').toBeVisible();
  await expect(paths.nth(1), 'Expected the second freehand contour to be visible').toBeVisible();

  await addedSegment.toggleVisibility();
  await expect(paths, 'Expected both contours to hide with the added segment').toHaveCount(0);

  await addedSegment.toggleVisibility();
  await expect(paths, 'Expected both contours to reappear with the added segment').toHaveCount(2);

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.freehandContourSegmentation.disjointContoursSeparate,
  });
});

test('should merge overlapping freehand contours drawn into the same segment', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const activeViewport = await viewportPageObject.active;
  const paths = activeViewport.svg('path');

  await expect(paths, 'Expected the starting number of paths to be 0').toHaveCount(0);
  await rightPanelPageObject.contourSegmentationPanel.tools.freehandContour.click();
  await activeViewport.normalizedPathDragAt({ path: dragShape });
  await expect(paths, 'Expected the first freehand contour to be added').toHaveCount(1);

  // An overlapping second contour is unioned into a single contour
  await activeViewport.normalizedPathDragAt({ path: overlappingDragShape });
  await expect(paths, 'Expected the overlapping contours to merge into one').toHaveCount(1);

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.freehandContourSegmentation.overlappingContoursMerged,
  });
});

test('should carve out overlapping freehand contours drawn into one segment when shift is held', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const activeViewport = await viewportPageObject.active;
  const paths = activeViewport.svg('path');

  await expect(paths, 'Expected the starting number of paths to be 0').toHaveCount(0);
  await rightPanelPageObject.contourSegmentationPanel.tools.freehandContour.click();
  await activeViewport.normalizedPathDragAt({ path: dragShape });
  await expect(paths, 'Expected the first freehand contour to be added').toHaveCount(1);

  // hold Shift
  await withKeyHeld({
    page,
    key: 'Shift',
    action: async () => {
      await activeViewport.normalizedPathDragAt({ path: overlappingDragShape });
    },
  });

  //only one contour remaining
  await expect(paths, 'Expected the carved contour to remain a single outline').toHaveCount(1);
  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.freehandContourSegmentation.overlappingContourCarvedOut,
  });
});

test('should cut a hole into a freehand contour when drawing with Shift held', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const activeViewport = await viewportPageObject.active;
  const paths = activeViewport.svg('path');

  await expect(paths, 'Expected the starting number of paths to be 0').toHaveCount(0);
  await rightPanelPageObject.contourSegmentationPanel.tools.freehandContour.click();
  await activeViewport.normalizedPathDragAt({ path: dragShape });
  await expect(paths, 'Expected the outer freehand contour to be added').toHaveCount(1);

  // A Shift stroke fully inside the contour cuts a hole into it.
  await withKeyHeld({
    page,
    key: 'Shift',
    action: async () => {
      await activeViewport.normalizedPathDragAt({ path: holeDragShape });
    },
  });

  // The hole is cut into the contour's path as a subpath rather than added as a
  // second path element; the screenshot then verifies the fill is actually cut.
  await expect(paths, 'Expected the contour and hole to render as one path').toHaveCount(1);
  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.freehandContourSegmentation.contourWithHole,
  });
});

test('should not merge overlapping freehand contours drawn into separate segments', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourPanel = rightPanelPageObject.contourSegmentationPanel;
  const panel = contourPanel.panel;
  const activeViewport = await viewportPageObject.active;
  const paths = activeViewport.svg('path');

  await expect(paths, 'Expected the starting number of paths to be 0').toHaveCount(0);
  await contourPanel.tools.freehandContour.click();
  await activeViewport.normalizedPathDragAt({ path: dragShape });
  await expect(paths, 'Expected the first freehand contour to be added').toHaveCount(1);

  await contourPanel.addSegmentButton.click();
  await expect(panel.rows, 'Expected a second segment row to be added').toHaveCount(2);
  await panel.nthSegment(1).click();

  await activeViewport.normalizedPathDragAt({ path: overlappingDragShape });
  await expect(paths, 'Expected the overlapping contours to stay separate').toHaveCount(2);

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath:
      screenShotPaths.freehandContourSegmentation.overlappingContoursNotMergedAcrossSegments,
  });
});

test('should not carve out overlapping freehand contours drawn into separate segments, when shift is held', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourPanel = rightPanelPageObject.contourSegmentationPanel;
  const panel = contourPanel.panel;
  const activeViewport = await viewportPageObject.active;
  const paths = activeViewport.svg('path');

  await expect(paths, 'Expected the starting number of paths to be 0').toHaveCount(0);
  await contourPanel.tools.freehandContour.click();
  await activeViewport.normalizedPathDragAt({ path: dragShape });
  await expect(paths, 'Expected the first freehand contour to be added').toHaveCount(1);

  await contourPanel.addSegmentButton.click();
  await expect(panel.rows, 'Expected a second segment row to be added').toHaveCount(2);
  await panel.nthSegment(1).click();
  await waitForViewportsRendered(page);

  // A Shift stroke cuts into the contours of the segment it is drawn in, so from the
  // second segment it has nothing to cut and must leave segment 1's contour whole.
  await withKeyHeld({
    page,
    key: 'Shift',
    action: async () => {
      await activeViewport.normalizedPathDragAt({ path: overlappingDragShape });
    },
  });

  // The stroke cuts nothing and creates nothing, so segment 1's contour stays the
  // only path; the screenshot then verifies it is left whole.
  await expect(paths, 'Expected the Shift stroke to leave a single path').toHaveCount(1);
  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath:
      screenShotPaths.freehandContourSegmentation.overlappingContourNotCarvedAcrossSegments,
  });
});
