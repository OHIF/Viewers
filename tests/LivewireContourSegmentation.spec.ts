import {
  checkForScreenshot,
  expect,
  getSvgAttribute,
  press,
  screenShotPaths,
  test,
  visitStudy,
  waitForViewportsRendered,
  withKeyHeld,
} from './utils';

// Tuned to edges in this study's first slice, and wide enough to leave room for a hole inside it; a new contour's first click must stay ~6px clear of existing outlines.
const contourClicks = [
  { x: 350, y: 330 },
  { x: 430, y: 210 },
  { x: 570, y: 240 },
  { x: 520, y: 340 },
];

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.12.2.1107.5.2.32.35162.30000015050317233592200000046';
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should cancel an in-progress Livewire contour segmentation via Escape', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourPanel = rightPanelPageObject.contourSegmentationPanel;

  // Creating a Contour-type segmentation enables the drawing tools and adds a default "Segment 1".
  await contourPanel.addSegmentation();
  await expect(contourPanel.panel.rows).toHaveCount(1);

  // Activate the Livewire Contour tool (a plain click arms it; no variants).
  await contourPanel.tools.livewireContour.click();

  const activeViewport = await viewportPageObject.active;
  await activeViewport.clickAt(contourClicks);

  // Ensure the four points clicked above are rendered in the DOM before pressing Escape
  await expect(activeViewport.svg('circle')).toHaveCount(4);
  await press({ page, key: 'Escape' });

  // Pressing Escape should cancel the in-progress Livewire contour
  await expect(activeViewport.nthAnnotation(0).locator).toBeHidden();

  // Draw again to verify the contour tool is still interactive after cancellation
  await activeViewport.clickAt(contourClicks);
  await expect(activeViewport.svg('circle')).toHaveCount(4);
});

test('should keep a completed Livewire contour segmentation after navigating away and back', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourPanel = rightPanelPageObject.contourSegmentationPanel;

  // Creating a Contour-type segmentation enables the drawing tools and adds a default "Segment 1".
  await contourPanel.addSegmentation();
  await expect(contourPanel.panel.rows).toHaveCount(1);

  // Activate the Livewire Contour tool (a plain click arms it; no variants).
  await contourPanel.tools.livewireContour.click();

  const activeViewport = await viewportPageObject.active;
  const paths = activeViewport.svg('path');
  const vertexHandles = activeViewport.svg('circle');
  await expect(paths, 'Expected no contour paths before drawing').toHaveCount(0);

  await activeViewport.clickAt(contourClicks);

  // Ensure the four vertices are rendered before closing the contour.
  await expect(vertexHandles, 'Expected the four clicked vertices to render').toHaveCount(4);

  // Double-clicking the last vertex closes the contour into a single SVG path.
  await activeViewport.doubleClickAt(contourClicks[3]);
  await expect(vertexHandles, 'Expected the vertex handles to clear on completion').toHaveCount(0);
  await expect(paths, 'Expected the closed livewire contour to be added').toHaveCount(1);
  await expect(paths.first(), 'Expected the drawn livewire contour to be visible').toBeVisible();

  // Capture the completed contour's geometry to compare after navigation. Guarding against null
  // here keeps the comparison below from passing vacuously on two missing paths.
  const drawnPathD = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  if (drawnPathD === null) {
    throw new Error('Expected the drawn livewire contour to render an SVG path');
  }

  // Add a second segment so selecting Segment 1 again below goes through a real activation.
  await contourPanel.addSegmentButton.click();
  await expect(contourPanel.panel.rows, 'Expected a second segment row to be added').toHaveCount(2);

  // Navigate away: the contour only renders on the slice it was drawn on.
  await activeViewport.sliceNavigation.toLastSlice();
  await waitForViewportsRendered(page);
  await expect(paths, 'Expected no contour paths on the last slice').toHaveCount(0);

  // Clicking Segment 1 activates it and jumps the viewport back to its contour.
  await contourPanel.panel.nthSegment(0).click();
  await expect(paths, 'Expected the livewire contour to re-render after jumping back').toHaveCount(
    1
  );
  await expect(
    paths.first(),
    'Expected the persisted livewire contour to be visible'
  ).toBeVisible();

  await expect(
    paths.first(),
    'Expected the persisted livewire contour to match what was drawn'
  ).toHaveAttribute('d', drawnPathD);
});

test('should enable the Livewire Contour tool only once a contour segmentation exists', async ({
  rightPanelPageObject,
}) => {
  const contourPanel = rightPanelPageObject.contourSegmentationPanel;

  // Open the contour toolbox without creating a segmentation.
  await contourPanel.select();

  await expect(
    contourPanel.tools.livewireContour.toolButton,
    'Expected Livewire to be unavailable with no contour segmentation'
  ).toBeDisabled();

  await contourPanel.addSegmentation();
  await expect(contourPanel.panel.rows).toHaveCount(1);

  await expect(
    contourPanel.tools.livewireContour.toolButton,
    'Expected creating a contour segmentation to enable Livewire'
  ).toBeEnabled();
});

test('should draw a Livewire contour into the active segment', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourPanel = rightPanelPageObject.contourSegmentationPanel;

  await contourPanel.addSegmentation();
  await expect(contourPanel.panel.rows).toHaveCount(1);

  // Add a second segment and make it the active drawing target.
  await contourPanel.addSegmentButton.click();
  await expect(contourPanel.panel.rows, 'Expected a second segment row to be added').toHaveCount(2);
  await contourPanel.panel.nthSegment(1).click();

  await contourPanel.tools.livewireContour.click();
  const activeViewport = await viewportPageObject.active;
  const paths = activeViewport.svg('path');

  await activeViewport.clickAt(contourClicks);
  await expect(
    activeViewport.svg('circle'),
    'Expected the four clicked vertices to render'
  ).toHaveCount(4);
  await activeViewport.doubleClickAt(contourClicks[3]);
  await expect(paths, 'Expected the contour to be added').toHaveCount(1);

  // The contour must belong to segment 2 (active during the draw): hiding segment 1 keeps it, hiding segment 2 removes it.
  await contourPanel.panel.nthSegment(0).toggleVisibility();
  await expect(paths, 'Expected the contour to stay visible while segment 1 is hidden').toHaveCount(
    1
  );

  await contourPanel.panel.nthSegment(1).toggleVisibility();
  await expect(paths, 'Expected the contour to hide with segment 2').toHaveCount(0);

  await contourPanel.panel.nthSegment(1).toggleVisibility();
  await expect(paths, 'Expected the contour to reappear with segment 2').toHaveCount(1);
});

test('should keep two disjoint Livewire contours separate within one segment', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  // Well clear of the first contour, around the bright feature lower in the slice.
  const disjointContourClicks = [
    { x: 400, y: 430 },
    { x: 445, y: 480 },
    { x: 405, y: 540 },
  ];

  const contourPanel = rightPanelPageObject.contourSegmentationPanel;

  await contourPanel.addSegmentation();
  await expect(contourPanel.panel.rows).toHaveCount(1);
  await contourPanel.tools.livewireContour.click();

  const activeViewport = await viewportPageObject.active;
  const paths = activeViewport.svg('path');
  const vertexHandles = activeViewport.svg('circle');

  await activeViewport.clickAt(contourClicks);
  await expect(vertexHandles, 'Expected the first contour vertices to render').toHaveCount(4);
  await activeViewport.doubleClickAt(contourClicks[3]);
  await expect(paths, 'Expected the first contour to be added').toHaveCount(1);

  // A second contour placed away from the first, so the union at completion has nothing to merge with.
  await activeViewport.clickAt(disjointContourClicks);
  await expect(vertexHandles, 'Expected the second contour vertices to render').toHaveCount(3);
  await activeViewport.doubleClickAt(disjointContourClicks[2]);
  await expect(
    vertexHandles,
    'Expected the second contour vertex handles to clear on completion'
  ).toHaveCount(0);

  await expect(paths, 'Expected both contours to render separately').toHaveCount(2);
  await expect(paths.first(), 'Expected the first contour to be visible').toBeVisible();
  await expect(paths.nth(1), 'Expected the second contour to be visible').toBeVisible();
});

test('should merge overlapping Livewire contours drawn into the same segment', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  // Starts below the first contour's bottom edge and crosses into it.
  const overlappingContourClicks = [
    { x: 450, y: 400 },
    { x: 540, y: 370 },
    { x: 470, y: 280 },
  ];

  const contourPanel = rightPanelPageObject.contourSegmentationPanel;

  await contourPanel.addSegmentation();
  await expect(contourPanel.panel.rows).toHaveCount(1);
  await contourPanel.tools.livewireContour.click();

  const activeViewport = await viewportPageObject.active;
  const paths = activeViewport.svg('path');
  const vertexHandles = activeViewport.svg('circle');

  await activeViewport.clickAt(contourClicks);
  await expect(vertexHandles, 'Expected the first contour vertices to render').toHaveCount(4);
  await activeViewport.doubleClickAt(contourClicks[3]);
  await expect(paths, 'Expected the first contour to be added').toHaveCount(1);

  // An overlapping second contour is merged into a single larger outline rather than kept alongside the first.
  await activeViewport.clickAt(overlappingContourClicks);
  await expect(vertexHandles, 'Expected the second contour vertices to render').toHaveCount(3);
  await activeViewport.doubleClickAt(overlappingContourClicks[2]);

  // The handles clearing is the completion signal, so this settles the draw before the compare.
  await expect(
    vertexHandles,
    'Expected the second contour vertex handles to clear on completion'
  ).toHaveCount(0);

  await checkForScreenshot({
    page,
    locator: activeViewport.pane,
    screenshotPath: screenShotPaths.livewireContourSegmentation.overlappingContoursMerged,
  });
});

test('should cut a hole into a Livewire contour when drawing with Shift held', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const holeContourClicks = [
    { x: 430, y: 270 },
    { x: 500, y: 270 },
    { x: 465, y: 310 },
  ];

  const contourPanel = rightPanelPageObject.contourSegmentationPanel;

  await contourPanel.addSegmentation();
  await expect(contourPanel.panel.rows).toHaveCount(1);
  await contourPanel.tools.livewireContour.click();

  const activeViewport = await viewportPageObject.active;
  const paths = activeViewport.svg('path');
  const vertexHandles = activeViewport.svg('circle');

  await activeViewport.clickAt(contourClicks);
  await expect(vertexHandles, 'Expected the four outer contour vertices to render').toHaveCount(4);
  await activeViewport.doubleClickAt(contourClicks[3]);
  await expect(paths, 'Expected the outer contour to be added').toHaveCount(1);

  await withKeyHeld({
    page,
    key: 'Shift',
    action: async () => {
      await activeViewport.clickAt(holeContourClicks);
      //check to see we're still drawing the smaller contour while holding shift
      await expect(vertexHandles, 'Expected the three hole vertices to render').toHaveCount(3);
      await activeViewport.doubleClickAt(holeContourClicks[2]);
    },
  });

  // The handles clearing is the completion signal, so this settles the draw before the compare.
  await expect(
    vertexHandles,
    'Expected the hole vertex handles to clear on completion'
  ).toHaveCount(0);

  await checkForScreenshot({
    page,
    locator: activeViewport.pane,
    screenshotPath: screenShotPaths.livewireContourSegmentation.contourWithHole,
  });
});
