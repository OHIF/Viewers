import type { Locator, Page } from '@playwright/test';
import {
  drawFreehandContour,
  expect,
  getSvgAttribute,
  goToSlice,
  test,
  visitStudy,
  waitForViewportsRendered,
} from './utils';
import { expectRowSelected } from './utils/assertions';
import type { RightPanelPageObject, ViewportPageObject } from './pages';

const studyInstanceUID = '1.3.12.2.1107.5.2.32.35162.30000015050317233592200000046';
const mode = 'segmentation';

// The study opens on its first slice; the segments are drawn on two slices away from it.
const firstSliceText = 'I:1 (1/128)';
const firstDrawnSlice = { index: 10, text: 'I:11 (11/128)' };
const secondDrawnSlice = { index: 40, text: 'I:41 (41/128)' };

// Kept on the left of the viewport, clear of the stats hover card that opens over its right side.
const brushStroke = { start: { x: 0.3, y: 0.3 }, end: { x: 0.4, y: 0.35 } };
const secondBrushStroke = { start: { x: 0.3, y: 0.6 }, end: { x: 0.4, y: 0.65 } };
// Longer than the first stroke, so a segment painted with it measures differently.
const longBrushStroke = { start: { x: 0.3, y: 0.6 }, end: { x: 0.45, y: 0.65 } };
// Paints over the first stroke and past it, changing the segment's shape.
const growingBrushStroke = { start: { x: 0.25, y: 0.2 }, end: { x: 0.45, y: 0.5 } };

// The two lines of a bidirectional label, such as 'L: 77.0 mm' and 'W: 49.7 mm'. Measured values
// come from Cornerstone's computation, so tests compare them with each other, not fixed numbers.
const bidirectionalLabelLines = [/^L: [\d.]+ mm$/, /^W: [\d.]+ mm$/];

// A measurement's text box is drawn green while it is selected and yellow otherwise.
const selectedTextColor = 'rgb(0, 255, 0)';
const unselectedTextColor = 'rgb(255, 255, 0)';

const contourShape = [
  { x: 0.4, y: 0.4 },
  { x: 0.6, y: 0.4 },
  { x: 0.6, y: 0.6 },
  { x: 0.4, y: 0.6 },
  { x: 0.4, y: 0.4 },
];

const secondContourShape = [
  { x: 0.65, y: 0.15 },
  { x: 0.85, y: 0.15 },
  { x: 0.85, y: 0.35 },
  { x: 0.65, y: 0.35 },
  { x: 0.65, y: 0.15 },
];

/**
 * Reads the number from a stat value or a bidirectional label line, such as 'L: 77.0 mm'.
 */
async function readNumber(locator: Locator) {
  return parseFloat(((await locator.textContent()) ?? '').replace(/^[LW]: /, ''));
}

test.beforeEach(async ({ page }) => {
  await visitStudy(page, studyInstanceUID, mode, 2000);
  await waitForViewportsRendered(page);
});

test.describe('Drawn labelmap segmentation', () => {
  test.beforeEach(async ({ rightPanelPageObject }) => {
    // Segmentation mode opens on the labelmap tab.
    const labelMapPanel = rightPanelPageObject.labelMapSegmentationPanel;
    await labelMapPanel.addSegmentationButton.click();
    await expect(labelMapPanel.panel.rows, 'Expected the default segment row').toHaveCount(1);
    await labelMapPanel.tools.brush.click();
  });

  test('should jump to the painted slice when clicking a drawn labelmap segment', async ({
    page,
    rightPanelPageObject,
    viewportPageObject,
  }) => {
    const labelMapPanel = rightPanelPageObject.labelMapSegmentationPanel;
    const { panel } = labelMapPanel;
    const activeViewport = await viewportPageObject.active;
    const sliceIndicator = activeViewport.overlayText.bottomRight.instanceNumber;

    // Paint Segment 1 on one slice and Segment 2 on another.
    await goToSlice({ page, viewport: activeViewport, slice: firstDrawnSlice });
    await activeViewport.normalizedDragAt(brushStroke);

    await labelMapPanel.addSegmentButton.click();
    await expect(panel.rows, 'Expected a second segment row').toHaveCount(2);
    await expectRowSelected(panel.nthSegment(1));

    await goToSlice({ page, viewport: activeViewport, slice: secondDrawnSlice });
    await activeViewport.normalizedDragAt(brushStroke);

    await activeViewport.sliceNavigation.toFirstSlice();
    await waitForViewportsRendered(page);
    await expect(sliceIndicator, 'Expected to leave the painted slices').toHaveText(firstSliceText);

    // The jump needs the segment's stats, and its stats card opens only once they are computed.
    await panel.nthSegment(1).stats.open();
    await panel.nthSegment(1).click();
    await expect(sliceIndicator, 'Expected the Segment 2 slice').toHaveText(secondDrawnSlice.text);
    await expectRowSelected(panel.nthSegment(1));

    // Out of listed order, back to Segment 1.
    await panel.nthSegment(0).click();
    await expect(sliceIndicator, 'Expected the Segment 1 slice').toHaveText(firstDrawnSlice.text);
    await expectRowSelected(panel.nthSegment(0));
  });

  test('should show the computed statistics of a drawn labelmap segment', async ({
    page,
    rightPanelPageObject,
    viewportPageObject,
  }) => {
    const segment = rightPanelPageObject.labelMapSegmentationPanel.panel.nthSegment(0);
    const activeViewport = await viewportPageObject.active;

    await goToSlice({ page, viewport: activeViewport, slice: firstDrawnSlice });
    await activeViewport.normalizedDragAt(brushStroke);

    // The card opens once the stats of the painted voxels are computed.
    await segment.stats.open();
    await expect(segment.stats.labels).toHaveText([
      'Min Value',
      'Min Coord',
      'Max Value',
      'Max Coord',
      'Mean Value',
      'Standard Deviation',
      'Voxel Count',
      'Median',
      'Skewness',
      'Kurtosis',
      'Volume',
      'Center',
    ]);
    await expect(segment.stats.unit('Volume')).toHaveText('mm³');
    await expect(segment.stats.value('Center')).toHaveText(/^(-?[\d.]+, ){2}-?[\d.]+$/);

    // The values come from Cornerstone's computation, so they are checked against each other.
    const voxelCount = () => readNumber(segment.stats.value('Voxel Count'));
    const volume = () => readNumber(segment.stats.value('Volume'));
    await expect.poll(voxelCount, 'Expected painted voxels').toBeGreaterThan(0);
    await expect.poll(volume, 'Expected a painted volume').toBeGreaterThan(0);
    const voxelCountBefore = await voxelCount();
    const volumeBefore = await volume();
    const centerBefore = (await segment.stats.value('Center').textContent()) ?? '';

    // Painting more of the segment, below the first stroke, recomputes its stats.
    await activeViewport.normalizedDragAt(secondBrushStroke);
    await segment.stats.open();
    await expect.poll(voxelCount).toBeGreaterThan(voxelCountBefore);
    await expect.poll(volume).toBeGreaterThan(volumeBefore);
    await expect(segment.stats.value('Center'), 'Expected the center to move').not.toHaveText(
      centerBefore
    );
  });

  test('should draw the largest bidirectional of a drawn labelmap segment', async ({
    page,
    rightPanelPageObject,
    viewportPageObject,
  }) => {
    const segment = rightPanelPageObject.labelMapSegmentationPanel.panel.nthSegment(0);
    const activeViewport = await viewportPageObject.active;
    const textBoxes = activeViewport.annotationTextBoxes;
    const labelLines = textBoxes.locator('tspan');

    await goToSlice({ page, viewport: activeViewport, slice: firstDrawnSlice });
    await activeViewport.normalizedDragAt(brushStroke);

    await expect(textBoxes, 'Expected no measurement before computing it').toHaveCount(0);
    await segment.stats.bidirectional.compute();

    // Drawn on the painted slice, with its length and width beside it.
    await expect(activeViewport.bidirectionalAxes).toHaveCount(2);
    await expect(textBoxes, 'Expected the measurement to be visible').toBeVisible();
    await expect(labelLines).toHaveText(bidirectionalLabelLines);
    await expect(activeViewport.overlayText.bottomRight.instanceNumber).toHaveText(
      firstDrawnSlice.text
    );

    // The card swaps its compute button for the same values.
    const [length, width] = await labelLines.allTextContents();
    await segment.stats.open();
    await expect(segment.stats.bidirectional.computeButton).toBeHidden();
    await expect(segment.stats.bidirectional.length).toHaveText(length);
    await expect(segment.stats.bidirectional.width).toHaveText(width);
  });

  test('should update the bidirectional values when a drawn segment changes shape', async ({
    page,
    rightPanelPageObject,
    viewportPageObject,
  }) => {
    const segment = rightPanelPageObject.labelMapSegmentationPanel.panel.nthSegment(0);
    const activeViewport = await viewportPageObject.active;
    const labelLines = activeViewport.annotationTextBoxes.locator('tspan');
    const labelLength = () => readNumber(labelLines.first());

    await goToSlice({ page, viewport: activeViewport, slice: firstDrawnSlice });
    await activeViewport.normalizedDragAt(brushStroke);
    await segment.stats.bidirectional.compute();
    await expect(labelLines).toHaveText(bidirectionalLabelLines);
    const lengthBefore = await labelLength();

    // Painting more of the segment measures it again, replacing the old measurement.
    await activeViewport.normalizedDragAt(growingBrushStroke);
    await expect.poll(labelLength, 'Expected a longer measurement').toBeGreaterThan(lengthBefore);
    await expect(activeViewport.bidirectionalAxes).toHaveCount(2);
    await expect(labelLines).toHaveText(bidirectionalLabelLines);

    const [length, width] = await labelLines.allTextContents();
    await segment.stats.open();
    await expect(segment.stats.bidirectional.length).toHaveText(length);
    await expect(segment.stats.bidirectional.width).toHaveText(width);
  });

  test('should jump to and highlight the bidirectional of a segment that is not selected', async ({
    page,
    rightPanelPageObject,
    viewportPageObject,
  }) => {
    const labelMapPanel = rightPanelPageObject.labelMapSegmentationPanel;
    const { panel } = labelMapPanel;
    const firstSegment = panel.nthSegment(0);
    const secondSegment = panel.nthSegment(1);
    const activeViewport = await viewportPageObject.active;
    const sliceIndicator = activeViewport.overlayText.bottomRight.instanceNumber;
    const textBoxes = activeViewport.annotationTextBoxes;
    const labelLines = textBoxes.locator('tspan');

    // Paint Segment 1 and Segment 2 on different slices, then measure each.
    await goToSlice({ page, viewport: activeViewport, slice: firstDrawnSlice });
    await activeViewport.normalizedDragAt(brushStroke);
    await labelMapPanel.addSegmentButton.click();
    await expect(panel.rows, 'Expected a second segment row').toHaveCount(2);
    await goToSlice({ page, viewport: activeViewport, slice: secondDrawnSlice });
    await activeViewport.normalizedDragAt(longBrushStroke);

    // Its card opens once Segment 2's stats are in, so no painting is still being processed.
    await secondSegment.stats.open();

    await firstSegment.stats.bidirectional.compute();
    await expect(sliceIndicator, 'Expected the Segment 1 slice').toHaveText(firstDrawnSlice.text);
    await expect(labelLines).toHaveText(bidirectionalLabelLines);
    const firstLabel = await labelLines.allTextContents();

    // The longer stroke measures differently, so each label identifies its segment.
    await secondSegment.stats.bidirectional.compute();
    await expect(sliceIndicator, 'Expected the Segment 2 slice').toHaveText(secondDrawnSlice.text);
    await expect(labelLines, 'Expected a different Segment 2 label').not.toHaveText(firstLabel);
    await expect(labelLines).toHaveText(bidirectionalLabelLines);
    const secondLabel = await labelLines.allTextContents();
    await expect(textBoxes).toHaveAttribute('fill', selectedTextColor);

    await expectRowSelected(secondSegment);
    await activeViewport.sliceNavigation.toFirstSlice();
    await waitForViewportsRendered(page);
    await expect(sliceIndicator, 'Expected to leave the painted slices').toHaveText(firstSliceText);
    await expect(textBoxes, 'Expected no measurement on the first slice').toHaveCount(0);

    // Jump to Segment 1's measurement while Segment 2 is the selected segment.
    await firstSegment.stats.bidirectional.jumpTo();
    await expect(sliceIndicator, 'Expected the Segment 1 slice').toHaveText(firstDrawnSlice.text);
    await expect(textBoxes, 'Expected the Segment 1 measurement to be visible').toBeVisible();
    await expect(labelLines).toHaveText(firstLabel);
    await expect(textBoxes, 'Expected Segment 1 measurement highlighted').toHaveAttribute(
      'fill',
      selectedTextColor
    );

    // Segment 2's measurement is no longer the highlighted one.
    await goToSlice({ page, viewport: activeViewport, slice: secondDrawnSlice });
    await expect(labelLines).toHaveText(secondLabel);
    await expect(textBoxes, 'Expected Segment 2 measurement not highlighted').toHaveAttribute(
      'fill',
      unselectedTextColor
    );
  });
});

test.describe('Drawn contour segmentation', () => {
  test.beforeEach(async ({ page, rightPanelPageObject }) => {
    const contourPanel = rightPanelPageObject.contourSegmentationPanel;
    await contourPanel.addSegmentation();
    await expect(contourPanel.panel.rows, 'Expected the default segment row').toHaveCount(1);
    await waitForViewportsRendered(page);
  });

  /**
   * Draws a freehand contour into Segment 1 on one slice, then adds Segment 2 and draws a
   * contour into it on another slice. Returns the SVG path of each contour.
   */
  async function drawContoursOnTwoSlices({
    page,
    rightPanelPageObject,
    viewportPageObject,
  }: {
    page: Page;
    rightPanelPageObject: RightPanelPageObject;
    viewportPageObject: ViewportPageObject;
  }) {
    const contourPanel = rightPanelPageObject.contourSegmentationPanel;
    const activeViewport = await viewportPageObject.active;
    const paths = activeViewport.svg('path');

    await goToSlice({ page, viewport: activeViewport, slice: firstDrawnSlice });
    await drawFreehandContour({
      segmentationPanel: contourPanel,
      viewport: activeViewport,
      path: contourShape,
    });
    await expect(paths, 'Expected the Segment 1 contour').toHaveCount(1);
    await waitForViewportsRendered(page);
    const firstContourPath = await getSvgAttribute({
      viewportPageObject,
      svgInnerElement: 'path',
      attributeName: 'd',
    });
    expect(firstContourPath, 'Expected the Segment 1 contour path').not.toBeNull();

    await contourPanel.addSegmentButton.click();
    await expect(contourPanel.panel.rows, 'Expected a second segment row').toHaveCount(2);
    await expectRowSelected(contourPanel.panel.nthSegment(1));

    await goToSlice({ page, viewport: activeViewport, slice: secondDrawnSlice });
    await expect(paths, 'Expected no contour on the second slice yet').toHaveCount(0);
    await drawFreehandContour({
      segmentationPanel: contourPanel,
      viewport: activeViewport,
      path: secondContourShape,
    });
    await expect(paths, 'Expected the Segment 2 contour').toHaveCount(1);
    await waitForViewportsRendered(page);
    const secondContourPath = await getSvgAttribute({
      viewportPageObject,
      svgInnerElement: 'path',
      attributeName: 'd',
    });
    expect(secondContourPath, 'Expected the Segment 2 contour path').not.toBeNull();

    return { firstContourPath, secondContourPath };
  }

  test('should return to the drawn slice when clicking a drawn contour segment', async ({
    page,
    rightPanelPageObject,
    viewportPageObject,
  }) => {
    const { panel } = rightPanelPageObject.contourSegmentationPanel;
    const activeViewport = await viewportPageObject.active;
    const sliceIndicator = activeViewport.overlayText.bottomRight.instanceNumber;
    const paths = activeViewport.svg('path');

    const { firstContourPath, secondContourPath } = await drawContoursOnTwoSlices({
      page,
      rightPanelPageObject,
      viewportPageObject,
    });

    await activeViewport.sliceNavigation.toFirstSlice();
    await waitForViewportsRendered(page);
    await expect(sliceIndicator, 'Expected to leave the drawn slices').toHaveText(firstSliceText);
    await expect(paths, 'Expected no contour on the first slice').toHaveCount(0);

    // Click the rows out of listed order: Segment 2, then Segment 1.
    await panel.nthSegment(1).click();
    await expect(sliceIndicator, 'Expected the Segment 2 slice').toHaveText(secondDrawnSlice.text);
    await expectRowSelected(panel.nthSegment(1));
    await expect(paths, 'Expected the Segment 2 contour').toHaveCount(1);
    await expect(paths.first(), 'Expected the Segment 2 contour to be visible').toBeVisible();
    await expect(paths.first()).toHaveAttribute('d', secondContourPath);

    await panel.nthSegment(0).click();
    await expect(sliceIndicator, 'Expected the Segment 1 slice').toHaveText(firstDrawnSlice.text);
    await expectRowSelected(panel.nthSegment(0));
    await expect(paths, 'Expected the Segment 1 contour').toHaveCount(1);
    await expect(paths.first(), 'Expected the Segment 1 contour to be visible').toBeVisible();
    await expect(paths.first()).toHaveAttribute('d', firstContourPath);
  });

  test('should rename and delete a drawn contour segment and its segmentation', async ({
    page,
    rightPanelPageObject,
    viewportPageObject,
  }) => {
    const contourPanel = rightPanelPageObject.contourSegmentationPanel;
    const { panel } = contourPanel;
    const activeViewport = await viewportPageObject.active;
    const sliceIndicator = activeViewport.overlayText.bottomRight.instanceNumber;
    const paths = activeViewport.svg('path');
    const renamedSegmentName = 'Drawn Lesion';

    const { firstContourPath, secondContourPath } = await drawContoursOnTwoSlices({
      page,
      rightPanelPageObject,
      viewportPageObject,
    });

    const drawnSegment = panel.nthSegment(0);
    await drawnSegment.actions.rename(renamedSegmentName);
    await expect(panel.getSegmentLabels()).toHaveText([renamedSegmentName, 'Segment 2']);

    // The renamed segment still leads to its contour.
    await drawnSegment.click();
    await expect(sliceIndicator, 'Expected the Segment 1 slice').toHaveText(firstDrawnSlice.text);
    await expectRowSelected(drawnSegment);
    await expect(paths.first(), 'Expected the Segment 1 contour to be visible').toBeVisible();
    await expect(paths.first()).toHaveAttribute('d', firstContourPath);

    await drawnSegment.actions.delete();
    await expect(panel.getSegmentLabels()).toHaveText(['Segment 2']);
    await expect(paths, 'Expected the deleted contour to be removed').toHaveCount(0);

    // The remaining segment keeps its contour.
    await panel.nthSegment(0).click();
    await expect(sliceIndicator, 'Expected the Segment 2 slice').toHaveText(secondDrawnSlice.text);
    await expectRowSelected(panel.nthSegment(0));
    await expect(paths, 'Expected the Segment 2 contour').toHaveCount(1);
    await expect(paths.first(), 'Expected the Segment 2 contour to be visible').toBeVisible();
    await expect(paths.first()).toHaveAttribute('d', secondContourPath);

    await panel.moreMenu.delete();
    await expect(panel.rows, 'Expected no segment rows').toHaveCount(0);
    await expect(paths, 'Expected every drawn contour to be removed').toHaveCount(0);
    await expect(contourPanel.addSegmentationButton.button).toBeVisible();
  });
});
