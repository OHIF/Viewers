import type { Locator } from '@playwright/test';
import type { RightPanelPageObject } from './pages';
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
// Big Sphere outline point counts in the default viewport, before and after Remove Points.
// Decimation tolerance is measured in canvas pixels, so these depend on the viewport size.
const BIG_SPHERE_POINT_COUNT = 667;
const BIG_SPHERE_DECIMATED_POINT_COUNT = 286;

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

// Shows only Big Sphere and activates it by clicking its row, after asserting the
// preconditions for its hardcoded row index.
const showBigSphereContourOnly = async ({
  contourSegmentationPanel,
  paths,
}: {
  contourSegmentationPanel: RightPanelPageObject['contourSegmentationPanel'];
  paths: Locator;
}) => {
  const panel = contourSegmentationPanel.panel;
  await expect(panel.rows).toHaveCount(4);
  await expect(panel.nthSegment(BIG_SPHERE_SEGMENT_INDEX).title).toHaveText(
    BIG_SPHERE_SEGMENT_LABEL
  );

  await contourShowOnlyNthSegment({
    segmentationPanel: contourSegmentationPanel,
    index: BIG_SPHERE_SEGMENT_INDEX,
  });
  await expect(paths, 'Expected only the Big Sphere contour path').toHaveCount(1);
};

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
  const smoothRenderCycle = waitForViewportRenderCycle(page);
  await smoothContours.smoothEdges();
  await smoothRenderCycle;

  await expect(paths, 'Expected smoothing to keep a single contour path').toHaveCount(1);
  await expect(paths.first(), 'Expected smoothing to change the contour').not.toHaveAttribute(
    'd',
    thresholdSvgPathBefore
  );

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.contourSmoothOperation.smoothEdgesThresholdResult,
  });
});

test('remove points reduces the active segment contour points', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourSegmentationPanel = rightPanelPageObject.contourSegmentationPanel;
  const activeViewport = await viewportPageObject.active;
  const paths = activeViewport.svg('path');

  await showBigSphereContourOnly({ contourSegmentationPanel, paths });
  const bigSphereSvgPathBefore = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  if (bigSphereSvgPathBefore === null) {
    throw new Error('Expected Big Sphere to render an SVG path before decimating');
  }
  expect(countSvgPathPoints(bigSphereSvgPathBefore), 'Expected the original point count').toBe(
    BIG_SPHERE_POINT_COUNT
  );

  const smoothContours = contourSegmentationPanel.smoothContours;
  const decimateRenderCycle = waitForViewportRenderCycle(page);
  await smoothContours.removePoints();
  await decimateRenderCycle;

  await expect(paths, 'Expected decimation to keep a single contour path').toHaveCount(1);
  const decimatedBigSphereContourPath = paths.first();

  await expect(decimatedBigSphereContourPath, 'Expected a visible contour').toBeVisible();
  const bigSphereSvgPathAfter = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  if (bigSphereSvgPathAfter === null) {
    throw new Error('Expected Big Sphere to render an SVG path after decimating');
  }
  expect(countSvgPathPoints(bigSphereSvgPathAfter), 'Expected the decimated point count').toBe(
    BIG_SPHERE_DECIMATED_POINT_COUNT
  );

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.contourSmoothOperation.removePointsBigSphereResult,
  });
});

test('remove points leaves an already decimated contour unchanged', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourSegmentationPanel = rightPanelPageObject.contourSegmentationPanel;
  const activeViewport = await viewportPageObject.active;
  const paths = activeViewport.svg('path');

  await showBigSphereContourOnly({ contourSegmentationPanel, paths });

  const smoothContours = contourSegmentationPanel.smoothContours;
  const firstDecimateRenderCycle = waitForViewportRenderCycle(page);
  await smoothContours.removePoints();
  await firstDecimateRenderCycle;

  await expect(paths, 'Expected decimation to keep a single contour path').toHaveCount(1);
  const decimatedSvgPath = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  if (decimatedSvgPath === null) {
    throw new Error('Expected Big Sphere to render an SVG path after the first decimation');
  }
  expect(countSvgPathPoints(decimatedSvgPath), 'Expected the decimated point count').toBe(
    BIG_SPHERE_DECIMATED_POINT_COUNT
  );

  // Every remaining point is already outside the decimation tolerance, so a second
  // pass has nothing left to remove.
  const secondDecimateRenderCycle = waitForViewportRenderCycle(page);
  await smoothContours.removePoints();
  await secondDecimateRenderCycle;

  await expect(paths, 'Expected a single contour path after the second pass').toHaveCount(1);
  const secondPassSvgPath = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  if (secondPassSvgPath === null) {
    throw new Error('Expected Big Sphere to render an SVG path after the second decimation');
  }
  expect(secondPassSvgPath, 'Expected the second pass to leave the path unchanged').toBe(
    decimatedSvgPath
  );
});
