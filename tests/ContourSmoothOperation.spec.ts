import {
  checkForViewportScreenshot,
  contourShowOnlyNthSegment,
  countSvgPathPoints,
  expect,
  getSvgAttribute,
  screenShotPaths,
  test,
  visitStudyAndHydrate,
  waitForViewportRenderCycle,
} from './utils';

const THRESHOLD_SEGMENT_INDEX = 0;
const THRESHOLD_SEGMENT_LABEL = 'Threshold';
const BIG_SPHERE_SEGMENT_INDEX = 1;
const BIG_SPHERE_SEGMENT_LABEL = 'Big Sphere';
// A closed SVG path ends with the closepath command (Z), optionally followed by whitespace.
const CLOSED_SVG_PATH_PATTERN = /Z\s*$/;

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

  // Preconditions for the hardcoded row index used below.
  await expect(panel.rows).toHaveCount(4);
  await expect(panel.nthSegment(THRESHOLD_SEGMENT_INDEX).title).toHaveText(THRESHOLD_SEGMENT_LABEL);

  // Show only Threshold and activate it by clicking its row.
  await contourShowOnlyNthSegment({
    segmentationPanel: contourSegmentationPanel,
    index: THRESHOLD_SEGMENT_INDEX,
  });
  await expect(paths, 'Expected only the Threshold contour path').toHaveCount(1);
  const thresholdSvgPathBefore = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  if (thresholdSvgPathBefore === null) {
    throw new Error('Expected Threshold to render an SVG path before smoothing');
  }

  const smoothContours = contourSegmentationPanel.smoothContours;
  await smoothContours.open();
  const smoothRenderCycle = waitForViewportRenderCycle(page);
  await smoothContours.smoothEdges();
  await smoothRenderCycle;

  await expect(paths, 'Expected smoothing to keep a single contour path').toHaveCount(1);
  await expect(paths.first(), 'Expected smoothing to change the contour').not.toHaveAttribute(
    'd',
    thresholdSvgPathBefore
  );

  await smoothContours.close();
  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.contourSmoothOperation.smoothEdgesThresholdResult,
  });
});

test('remove points decimates the active segment contour and reduces its point count', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourSegmentationPanel = rightPanelPageObject.contourSegmentationPanel;
  const panel = contourSegmentationPanel.panel;
  const activeViewport = await viewportPageObject.active;
  const paths = activeViewport.svg('path');

  // Preconditions for the hardcoded row index used below.
  await expect(panel.rows).toHaveCount(4);
  await expect(panel.nthSegment(BIG_SPHERE_SEGMENT_INDEX).title).toHaveText(
    BIG_SPHERE_SEGMENT_LABEL
  );

  // Show only Big Sphere and activate it by clicking its row.
  await contourShowOnlyNthSegment({
    segmentationPanel: contourSegmentationPanel,
    index: BIG_SPHERE_SEGMENT_INDEX,
  });
  await expect(paths, 'Expected only the Big Sphere contour path').toHaveCount(1);
  const bigSphereSvgPathBefore = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  if (bigSphereSvgPathBefore === null) {
    throw new Error('Expected Big Sphere to render an SVG path before decimating');
  }
  const pointCountBefore = countSvgPathPoints(bigSphereSvgPathBefore);
  expect(pointCountBefore, 'Expected a contour dense enough to decimate').toBeGreaterThan(10);

  const smoothContours = contourSegmentationPanel.smoothContours;
  const decimateRenderCycle = waitForViewportRenderCycle(page);
  await smoothContours.removePoints();
  await decimateRenderCycle;

  await expect(paths, 'Expected decimation to keep a single contour path').toHaveCount(1);
  await expect(paths.first(), 'Expected decimation to change the contour').not.toHaveAttribute(
    'd',
    bigSphereSvgPathBefore
  );
  const bigSphereSvgPathAfter = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  if (bigSphereSvgPathAfter === null) {
    throw new Error('Expected Big Sphere to render an SVG path after decimating');
  }
  expect(countSvgPathPoints(bigSphereSvgPathAfter), 'Expected fewer contour points').toBeLessThan(
    pointCountBefore
  );
  expect(bigSphereSvgPathAfter, 'Expected the decimated contour to stay closed').toMatch(
    CLOSED_SVG_PATH_PATTERN
  );

  await smoothContours.close();
  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.contourSmoothOperation.removePointsBigSphereResult,
  });
});
