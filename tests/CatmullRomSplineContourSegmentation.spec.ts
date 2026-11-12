import { expect, test, visitStudy } from './utils';
import { press } from './utils/keyboardUtils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.12.2.1107.5.2.32.35162.30000015050317233592200000046';
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should cancel an in-progress Catmull-Rom spline contour segmentation via Escape', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourPanel = rightPanelPageObject.contourSegmentationPanel;

  // Create a Contour-type segmentation so the contour drawing tools become enabled.
  // Creating it adds a default "Segment 1"; wait for that row before drawing.
  await contourPanel.addSegmentation();
  await expect(contourPanel.panel.rows).toHaveCount(1);

  // Activate the Spline Contour tool, then arm the Catmull-Rom spline variant.
  await contourPanel.tools.splineContour.click();
  await contourPanel.tools.splineContour.selectType('catmullRom');

  const activeViewport = await viewportPageObject.active;
  await activeViewport.clickAt([
    { x: 380, y: 299 },
    { x: 420, y: 236 },
    { x: 523, y: 232 },
  ]);

  // Ensure the three points clicked above are rendered in the DOM before pressing Escape
  await expect(activeViewport.svg('circle')).toHaveCount(3);
  await press({ page, key: 'Escape' });

  // Pressing Escape should cancel the in-progress Catmull-Rom spline contour
  await expect(activeViewport.nthAnnotation(0).locator).toBeHidden();

  // Draw again to verify the contour tool is still interactive after cancellation
  await activeViewport.clickAt([
    { x: 380, y: 299 },
    { x: 420, y: 236 },
    { x: 523, y: 232 },
  ]);
  await expect(activeViewport.svg('circle')).toHaveCount(3);
});

test('should keep the first spline contour visible after drawing a second one on the same slice', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourPanel = rightPanelPageObject.contourSegmentationPanel;
  await contourPanel.addSegmentation();
  await expect(contourPanel.panel.rows).toHaveCount(1);

  await contourPanel.tools.splineContour.click();
  await contourPanel.tools.splineContour.selectType('catmullRom');

  const activeViewport = await viewportPageObject.active;
  const svgPaths = activeViewport.svg('path');

  await activeViewport.clickAt([
    { x: 250, y: 250 },
    { x: 320, y: 220 },
    { x: 290, y: 310 },
    { x: 252, y: 252 },
  ]);

  // After first contour completes, there should be no circles and one path.
  // Circles represent the spline fit points and are only visible while the spline is being edited.
  await expect(activeViewport.svg('circle')).toHaveCount(0);

  await expect(svgPaths).toHaveCount(1);

  await activeViewport.clickAt([
    { x: 420, y: 320 },
    { x: 500, y: 290 },
    { x: 460, y: 390 },
    { x: 422, y: 322 },
  ]);

  await expect(activeViewport.svg('circle')).toHaveCount(0);

  // both completed contours must remain in the SVG overlay
  await expect(svgPaths).toHaveCount(2);
});
