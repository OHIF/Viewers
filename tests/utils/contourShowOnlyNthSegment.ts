import type { RightPanelPageObject } from '../pages';

// Hide all segments, to show only the nth one and makes it the active segment
export async function contourShowOnlyNthSegment({
  segmentationPanel,
  index = 0,
}: {
  segmentationPanel: RightPanelPageObject['contourSegmentationPanel'];
  index?: number;
}) {
  await segmentationPanel.segmentsVisibilityToggle.click();
  const segment = segmentationPanel.panel.nthSegment(index);
  await segment.toggleVisibility();
  await segment.click();
  return segment;
}
