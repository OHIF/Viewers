import {
  checkForViewportScreenshot,
  expect,
  screenShotPaths,
  test,
  visitStudy,
  waitForViewportsRendered,
} from './utils';
import { withKeyHeld } from './utils/keyboardUtils';

const studyInstanceUID = '1.3.12.2.1107.5.2.32.35162.30000015050317233592200000046';
const mode = 'segmentation';

const clickShape = [
  { x: 0.4, y: 0.4 },
  { x: 0.6, y: 0.4 },
  { x: 0.6, y: 0.6 },
  { x: 0.4, y: 0.6 },
];

const secondClickShape = [
  { x: 0.65, y: 0.15 },
  { x: 0.85, y: 0.15 },
  { x: 0.85, y: 0.35 },
  { x: 0.65, y: 0.35 },
];

const overlappingClickShape = [
  { x: 0.5, y: 0.5 },
  { x: 0.7, y: 0.5 },
  { x: 0.7, y: 0.7 },
  { x: 0.5, y: 0.7 },
];

test.beforeEach(async ({ page, rightPanelPageObject }) => {
  await visitStudy(page, studyInstanceUID, mode, 2000);
  await waitForViewportsRendered(page);

  const contourPanel = rightPanelPageObject.contourSegmentationPanel;
  await contourPanel.addSegmentation();
  await expect(contourPanel.panel.rows, 'Expected the default segment row to be added').toHaveCount(
    1
  );
});

test('should keep a spline contour drawn on a slice after navigating away and back', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const activeViewport = await viewportPageObject.active;
  const paths = activeViewport.svg('path');

  //Force navigate to first slice
  await activeViewport.sliceNavigation.toFirstSlice();

  await expect(paths, 'Expected the starting number of paths to be 0').toHaveCount(0);
  await rightPanelPageObject.contourSegmentationPanel.tools.splineContour.click();
  await activeViewport.normalizedClickAt(clickShape);
  await activeViewport.normalizedDoubleClickAt(clickShape[clickShape.length - 1]);
  await expect(paths, 'Expected the spline contour to be added on the drawing slice').toHaveCount(
    1
  );
  await expect(
    paths.nth(0),
    'Expected the drawn spline contour to be visible on the drawing slice'
  ).toBeVisible();

  await waitForViewportsRendered(page);

  //Navigate to last slice
  await activeViewport.sliceNavigation.toLastSlice();
  await expect(paths, 'Expected the spline contour to be absent from the other slice').toHaveCount(
    0
  );
  // Come back to first slice
  await activeViewport.sliceNavigation.toFirstSlice();
  await expect(paths, 'Expected the spline contour to re-render on the drawing slice').toHaveCount(
    1
  );

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.splineContourSegmentation.contourPersistedAfterNavigation,
  });
});

test('should keep multiple spline contours drawn into one segment separate', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const activeViewport = await viewportPageObject.active;
  const panel = rightPanelPageObject.contourSegmentationPanel.panel;
  const paths = activeViewport.svg('path');

  await expect(paths, 'Expected the starting number of paths to be 0').toHaveCount(0);

  await rightPanelPageObject.contourSegmentationPanel.tools.splineContour.click();
  await activeViewport.normalizedClickAt(clickShape);
  await activeViewport.normalizedDoubleClickAt(clickShape[clickShape.length - 1]);
  await expect(paths, 'Expected the first spline contour to be added').toHaveCount(1);

  await activeViewport.normalizedClickAt(secondClickShape);
  await activeViewport.normalizedDoubleClickAt(secondClickShape[secondClickShape.length - 1]);
  await expect(paths, 'Expected both spline contours to render separately').toHaveCount(2);
  await expect(paths.nth(0), 'Expected the first spline contour to be visible').toBeVisible();
  await expect(paths.nth(1), 'Expected the second spline contour to be visible').toBeVisible();

  await waitForViewportsRendered(page);

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.splineContourSegmentation.disjointContoursSeparate,
  });
});

test('should merge overlapping spline contours drawn into one segment', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const activeViewport = await viewportPageObject.active;
  const paths = activeViewport.svg('path');

  await expect(paths, 'Expected the starting number of paths to be 0').toHaveCount(0);
  await rightPanelPageObject.contourSegmentationPanel.tools.splineContour.click();
  await activeViewport.normalizedClickAt(clickShape);
  await activeViewport.normalizedDoubleClickAt(clickShape[clickShape.length - 1]);
  await expect(paths, 'Expected the first spline contour to be added').toHaveCount(1);

  // An overlapping second contour is unioned into a single contour
  await activeViewport.normalizedClickAt(overlappingClickShape);
  await activeViewport.normalizedDoubleClickAt(
    overlappingClickShape[overlappingClickShape.length - 1]
  );
  await expect(paths, 'Expected the overlapping contours to merge into one').toHaveCount(1);

  await waitForViewportsRendered(page);

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.splineContourSegmentation.overlappingContoursMerged,
  });
});

test('should carve out overlapping spline contours drawn into one segment when shift is held', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const activeViewport = await viewportPageObject.active;
  const paths = activeViewport.svg('path');

  await expect(paths, 'Expected the starting number of paths to be 0').toHaveCount(0);
  await rightPanelPageObject.contourSegmentationPanel.tools.splineContour.click();
  await activeViewport.normalizedClickAt(clickShape);
  await activeViewport.normalizedDoubleClickAt(clickShape[clickShape.length - 1]);
  await expect(paths, 'Expected the first spline contour to be added').toHaveCount(1);

  // hold Shift
  await withKeyHeld({
    page,
    key: 'Shift',
    action: async () => {
      await activeViewport.normalizedClickAt(overlappingClickShape);
      await activeViewport.normalizedDoubleClickAt(
        overlappingClickShape[overlappingClickShape.length - 1]
      );
    },
  });

  //only one contour remaining
  await expect(paths, 'Expected the carved contour to remain a single outline').toHaveCount(1);

  // The carved contour re-renders for a few frames after the difference lands;
  // capture only once that settles so the baseline holds the final outline.
  await waitForViewportsRendered(page);

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.splineContourSegmentation.overlappingContourCarvedOut,
  });
});
