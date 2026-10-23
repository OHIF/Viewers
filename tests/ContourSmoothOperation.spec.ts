import {
  checkForViewportScreenshot,
  contourShowOnlyNthSegment,
  countSvgPathPoints,
  expect,
  screenShotPaths,
  test,
  visitStudyAndHydrate,
  waitForViewportRenderCycle,
} from './utils';

const THRESHOLD_SEGMENT_INDEX = 0;
const THRESHOLD_SEGMENT_LABEL = 'Threshold';
const BIG_SPHERE_SEGMENT_INDEX = 1;
const BIG_SPHERE_SEGMENT_LABEL = 'Big Sphere';
const SMALL_SPHERE_SEGMENT_INDEX = 2;
const SMALL_SPHERE_SEGMENT_LABEL = 'Small Sphere';

test.beforeEach(async ({ page, leftPanelPageObject, DOMOverlayPageObject }) => {
  const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';

  await visitStudyAndHydrate({
    page,
    leftPanelPageObject,
    DOMOverlayPageObject,
    studyInstanceUID,
    modality: 'RTSTRUCT',
  });
});

test('smooth edges changes the active segment contour and keeps it closed', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourSegmentationPanel = rightPanelPageObject.contourSegmentationPanel;
  const panel = contourSegmentationPanel.panel;
  const activeViewport = await viewportPageObject.active;
  const paths = activeViewport.svg('path');
  const contourPath = paths.first();

  // Preconditions for the hardcoded row indexes used below.
  await expect(panel.rows).toHaveCount(4);
  await expect(panel.nthSegment(THRESHOLD_SEGMENT_INDEX).title).toHaveText(THRESHOLD_SEGMENT_LABEL);
  await expect(panel.nthSegment(BIG_SPHERE_SEGMENT_INDEX).title).toHaveText(
    BIG_SPHERE_SEGMENT_LABEL
  );

  // Record Big Sphere's outline so the end of the test can show only the active segment changed.
  await contourShowOnlyNthSegment({
    segmentationPanel: contourSegmentationPanel,
    index: BIG_SPHERE_SEGMENT_INDEX,
  });
  await expect(paths, 'Expected only the Big Sphere contour path').toHaveCount(1);
  const bigSphereSvgPath = await contourPath.getAttribute('d');
  if (bigSphereSvgPath === null) {
    throw new Error('Expected Big Sphere to render an SVG path before smoothing');
  }

  // Show every segment again, so only Threshold is left showing after the next call.
  await contourSegmentationPanel.segmentsVisibilityToggle.click();
  await contourShowOnlyNthSegment({
    segmentationPanel: contourSegmentationPanel,
    index: THRESHOLD_SEGMENT_INDEX,
  });
  await expect(paths, 'Expected only the Threshold contour path').toHaveCount(1);
  const thresholdSvgPathBefore = await contourPath.getAttribute('d');
  if (thresholdSvgPathBefore === null) {
    throw new Error('Expected Threshold to render an SVG path before smoothing');
  }

  const smoothContours = contourSegmentationPanel.smoothContours;
  const smoothRenderCycle = waitForViewportRenderCycle(page);
  await smoothContours.smoothEdges();
  await smoothRenderCycle;

  await expect(paths, 'Expected smoothing to keep a single contour path').toHaveCount(1);
  await expect(contourPath, 'Expected smoothing to change the contour').not.toHaveAttribute(
    'd',
    thresholdSvgPathBefore
  );

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.contourSmoothOperation.smoothEdgesThresholdResult,
  });

  await contourSegmentationPanel.segmentsVisibilityToggle.click();
  await contourShowOnlyNthSegment({
    segmentationPanel: contourSegmentationPanel,
    index: BIG_SPHERE_SEGMENT_INDEX,
  });
  await expect(paths, 'Expected only the Big Sphere contour path').toHaveCount(1);
  await expect(contourPath, 'Expected Big Sphere as-is').toHaveAttribute('d', bigSphereSvgPath);
});

test('remove points reduces the active segment contour points', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourSegmentationPanel = rightPanelPageObject.contourSegmentationPanel;
  const panel = contourSegmentationPanel.panel;
  const activeViewport = await viewportPageObject.active;
  const paths = activeViewport.svg('path');
  const contourPath = paths.first();
  const pointCount = () => countSvgPathPoints({ path: contourPath });

  // Preconditions for the hardcoded row indexes used below.
  await expect(panel.rows).toHaveCount(4);
  await expect(panel.nthSegment(BIG_SPHERE_SEGMENT_INDEX).title).toHaveText(
    BIG_SPHERE_SEGMENT_LABEL
  );
  await expect(panel.nthSegment(SMALL_SPHERE_SEGMENT_INDEX).title).toHaveText(
    SMALL_SPHERE_SEGMENT_LABEL
  );

  // Record Small Sphere's outline so the end of the test can show only the active segment changed.
  await contourShowOnlyNthSegment({
    segmentationPanel: contourSegmentationPanel,
    index: SMALL_SPHERE_SEGMENT_INDEX,
  });
  await expect(paths, 'Expected only the Small Sphere contour path').toHaveCount(1);
  const smallSphereSvgPath = await contourPath.getAttribute('d');
  if (smallSphereSvgPath === null) {
    throw new Error('Expected Small Sphere to render an SVG path before decimating');
  }

  // Show every segment again, so only Big Sphere is left showing after the next call.
  await contourSegmentationPanel.segmentsVisibilityToggle.click();
  await contourShowOnlyNthSegment({
    segmentationPanel: contourSegmentationPanel,
    index: BIG_SPHERE_SEGMENT_INDEX,
  });
  await expect(paths, 'Expected only the Big Sphere contour path').toHaveCount(1);
  // Check that decimated count drops by more than 50%
  const pointsBefore = await pointCount();

  const decimateRenderCycle = waitForViewportRenderCycle(page);
  await contourSegmentationPanel.smoothContours.removePoints();
  await decimateRenderCycle;

  await expect(paths, 'Expected decimation to keep a single contour path').toHaveCount(1);
  await expect(contourPath, 'Expected a visible contour').toBeVisible();
  await expect.poll(pointCount, 'Expected most points removed').toBeLessThan(pointsBefore / 2);

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.contourSmoothOperation.removePointsBigSphereResult,
  });

  await contourSegmentationPanel.segmentsVisibilityToggle.click();
  await contourShowOnlyNthSegment({
    segmentationPanel: contourSegmentationPanel,
    index: SMALL_SPHERE_SEGMENT_INDEX,
  });
  await expect(paths, 'Expected only the Small Sphere contour path').toHaveCount(1);
  await expect(contourPath, 'Expected Small Sphere as-is').toHaveAttribute('d', smallSphereSvgPath);
});

test('remove points leaves an already decimated contour unchanged', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourSegmentationPanel = rightPanelPageObject.contourSegmentationPanel;
  const panel = contourSegmentationPanel.panel;
  const activeViewport = await viewportPageObject.active;
  const paths = activeViewport.svg('path');
  const contourPath = paths.first();
  const pointCount = () => countSvgPathPoints({ path: contourPath });

  // Preconditions for the hardcoded row index used below.
  await expect(panel.rows).toHaveCount(4);
  await expect(panel.nthSegment(BIG_SPHERE_SEGMENT_INDEX).title).toHaveText(
    BIG_SPHERE_SEGMENT_LABEL
  );

  await contourShowOnlyNthSegment({
    segmentationPanel: contourSegmentationPanel,
    index: BIG_SPHERE_SEGMENT_INDEX,
  });
  await expect(paths, 'Expected only the Big Sphere contour path').toHaveCount(1);
  const pointsBefore = await pointCount();

  const smoothContours = contourSegmentationPanel.smoothContours;
  const firstDecimateRenderCycle = waitForViewportRenderCycle(page);
  await smoothContours.removePoints();
  await firstDecimateRenderCycle;

  await expect(paths, 'Expected decimation to keep a single contour path').toHaveCount(1);
  await expect.poll(pointCount, 'Expected most points removed').toBeLessThan(pointsBefore / 2);
  const decimatedSvgPath = await contourPath.getAttribute('d');
  if (decimatedSvgPath === null) {
    throw new Error('Expected Big Sphere to render an SVG path after the first decimation');
  }

  // Every remaining point is already outside the decimation tolerance, so a second
  // pass has nothing left to remove.
  const secondDecimateRenderCycle = waitForViewportRenderCycle(page);
  await smoothContours.removePoints();
  await secondDecimateRenderCycle;

  await expect(paths, 'Expected a single contour path after the second pass').toHaveCount(1);
  await expect(contourPath, 'Expected an unchanged path').toHaveAttribute('d', decimatedSvgPath);
});
