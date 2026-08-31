import {
  checkForViewportScreenshot,
  contourShowOnlyNthSegment,
  expect,
  getSvgAttribute,
  screenShotPaths,
  test,
  visitStudyAndHydrate,
  waitForViewportRenderCycle,
} from './utils';

const THRESHOLD_SEGMENT_INDEX = 0;
const THRESHOLD_SEGMENT_LABEL = 'Threshold';

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
  await expect(paths.first(), 'Expected the smoothed contour to stay closed').toHaveAttribute(
    'd',
    /Z\s*$/
  );

  await smoothContours.close();
  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.contourSmoothOperation.smoothEdgesThresholdResult,
  });
});
