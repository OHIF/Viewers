import { expect, test, visitStudy } from './utils';
import { press } from './utils/keyboardUtils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.12.2.1107.5.2.32.35162.30000015050317233592200000046';
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should cancel an in-progress B-Spline contour segmentation via Escape', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourPanel = rightPanelPageObject.contourSegmentationPanel;

  // Create a Contour-type segmentation so the contour drawing tools become enabled.
  // Creating it adds a default "Segment 1"; wait for that row before drawing.
  await contourPanel.addSegmentation();
  await expect(contourPanel.panel.rows).toHaveCount(1);

  // Activate the Spline Contour tool, then switch to the B-Spline variant.
  await contourPanel.tools.splineContour.click();
  await contourPanel.tools.splineContour.selectType('bSpline');

  const activeViewport = await viewportPageObject.active;
  await activeViewport.clickAt([
    { x: 380, y: 299 },
    { x: 420, y: 236 },
    { x: 523, y: 232 },
  ]);

  // Ensure the three points clicked above are rendered in the DOM before pressing Escape
  await expect(activeViewport.svg('circle')).toHaveCount(3);
  await press({ page, key: 'Escape' });

  // Pressing Escape should cancel the in-progress B-Spline contour
  await expect(activeViewport.nthAnnotation(0).locator).toBeHidden();

  // Draw again to verify the contour tool is still interactive after cancellation
  await activeViewport.clickAt([
    { x: 380, y: 299 },
    { x: 420, y: 236 },
    { x: 523, y: 232 },
  ]);
  await expect(activeViewport.svg('circle')).toHaveCount(3);
});
