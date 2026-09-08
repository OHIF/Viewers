import type { RightPanelPageObject } from '../pages';
import type { IViewportPageObject } from '../pages/ViewportPageObject';

/**
 * Draws a closed freehand contour into the active segment by dragging along the given
 * normalized viewport path. The freehand tool is activated first unless the caller states
 * that it is already active (drawing several contours in a row keeps the tool armed).
 */
export async function drawFreehandContour({
  segmentationPanel,
  viewport,
  path,
  activateTool = true,
}: {
  segmentationPanel: RightPanelPageObject['contourSegmentationPanel'];
  viewport: IViewportPageObject;
  path: { x: number; y: number }[];
  activateTool?: boolean;
}) {
  if (activateTool) {
    await segmentationPanel.tools.freehandContour.click();
  }

  await viewport.normalizedPathDragAt({ path });
}
