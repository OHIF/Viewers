import type { RightPanelPageObject } from '../pages';
import type { IViewportPageObject } from '../pages/ViewportPageObject';

/**
 * Draws a closed freehand contour into the active segment by dragging along the given
 * normalized viewport path.
 */
export async function drawFreehandContour({
  segmentationPanel,
  viewport,
  path,
}: {
  segmentationPanel: RightPanelPageObject['contourSegmentationPanel'];
  viewport: IViewportPageObject;
  path: { x: number; y: number }[];
}) {
  await segmentationPanel.tools.freehandContour.click();
  await viewport.normalizedPathDragAt({ path });
}
