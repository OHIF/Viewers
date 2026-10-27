import type { Page } from '@playwright/test';

import {
  expect,
  getSvgAttribute,
  getViewportCanvasStats,
  test,
  visitStudy,
  waitForViewportPainted,
  waitForViewportsRendered,
} from './utils';

const STUDY_UID = '1.3.12.2.1107.5.2.32.35162.30000015050317233592200000046';

const BRUSH_STROKE = { start: { x: 0.3, y: 0.5 }, end: { x: 0.7, y: 0.5 } };
// Crosses the middle of the brush stroke, so it erases part of it.
const ERASER_STROKE = { start: { x: 0.5, y: 0.3 }, end: { x: 0.5, y: 0.7 } };

const CONTOUR_PATH = [
  { x: 0.4, y: 0.4 },
  { x: 0.6, y: 0.4 },
  { x: 0.6, y: 0.6 },
  { x: 0.4, y: 0.6 },
  { x: 0.4, y: 0.4 },
];

const NEW_SEGMENT_HEX = '#FF5722';
const NEW_SEGMENT_CSS_RGB = 'rgb(255, 87, 34)';

// A digest of the pixels painted on the default viewport. The labelmap is drawn
// onto the same canvas, so the digest changes with every visible labelmap edit.
async function canvasDigest(page: Page) {
  return (await getViewportCanvasStats({ page })).digest;
}

function pollDigest(page: Page, message: string) {
  return expect.poll(() => canvasDigest(page), { message });
}

// Waits for an edit to repaint the canvas, then reads the digest once rendering settles,
// so a stroke is read after its last paint rather than partway through.
async function digestAfterChange(page: Page, previous: number, message: string) {
  await pollDigest(page, message).not.toBe(previous);
  await waitForViewportsRendered(page);
  return canvasDigest(page);
}

test.describe('labelmap', () => {
  test.beforeEach(async ({ page, rightPanelPageObject }) => {
    await visitStudy(page, STUDY_UID, 'segmentation', 2000);
    await waitForViewportsRendered(page);

    const { labelMapSegmentationPanel } = rightPanelPageObject;
    await labelMapSegmentationPanel.addSegmentationButton.click();
    await expect(labelMapSegmentationPanel.panel.rows).toHaveCount(1);
    await waitForViewportsRendered(page);
    await labelMapSegmentationPanel.tools.brush.click();
  });

  test('should undo and redo a brush stroke', async ({
    page,
    mainToolbarPageObject,
    viewportPageObject,
  }) => {
    const viewport = await viewportPageObject.active;
    const unpainted = await canvasDigest(page);

    await viewport.normalizedDragAt(BRUSH_STROKE);
    const painted = await digestAfterChange(page, unpainted, 'Expected the brush stroke to paint');

    await mainToolbarPageObject.undo.click();
    await pollDigest(page, 'Expected undo to clear the stroke').toBe(unpainted);
    await expect(mainToolbarPageObject.undo.button).toBeDisabled();

    await mainToolbarPageObject.redo.click();
    await pollDigest(page, 'Expected redo to repaint the stroke').toBe(painted);
    await expect(mainToolbarPageObject.redo.button).toBeDisabled();
  });

  test('should undo an eraser stroke, then the brush stroke under it', async ({
    page,
    mainToolbarPageObject,
    rightPanelPageObject,
    viewportPageObject,
  }) => {
    const viewport = await viewportPageObject.active;
    const unpainted = await canvasDigest(page);

    await viewport.normalizedDragAt(BRUSH_STROKE);
    const painted = await digestAfterChange(page, unpainted, 'Expected the brush stroke to paint');

    await rightPanelPageObject.labelMapSegmentationPanel.tools.eraser.click();
    await viewport.normalizedDragAt(ERASER_STROKE);
    await digestAfterChange(page, painted, 'Expected the eraser to remove part of the stroke');
    await pollDigest(page, 'Expected the eraser to leave the rest of the stroke').not.toBe(
      unpainted
    );

    await mainToolbarPageObject.undo.click();
    await pollDigest(page, 'Expected undo to restore the erased part').toBe(painted);

    await mainToolbarPageObject.undo.click();
    await pollDigest(page, 'Expected a second undo to clear the stroke').toBe(unpainted);
  });

  test('should undo and redo a segment delete', async ({
    page,
    mainToolbarPageObject,
    rightPanelPageObject,
    viewportPageObject,
  }) => {
    const viewport = await viewportPageObject.active;
    const { panel } = rightPanelPageObject.labelMapSegmentationPanel;
    const unpainted = await canvasDigest(page);

    await viewport.normalizedDragAt(BRUSH_STROKE);
    const painted = await digestAfterChange(page, unpainted, 'Expected the brush stroke to paint');
    const segmentName = await panel.nthSegment(0).title.innerText();

    await panel.nthSegment(0).actions.delete();
    await expect(panel.rows).toHaveCount(0);
    await pollDigest(page, 'Expected the delete to clear its pixels').toBe(unpainted);

    await mainToolbarPageObject.undo.click();
    await expect(panel.rows, 'Expected undo to restore the segment row').toHaveCount(1);
    await expect(panel.nthSegment(0).title).toHaveText(segmentName);
    await pollDigest(page, 'Expected undo to restore its pixels').toBe(painted);

    await mainToolbarPageObject.redo.click();
    await expect(panel.rows, 'Expected redo to delete the segment again').toHaveCount(0);
    await pollDigest(page, 'Expected redo to clear its pixels again').toBe(unpainted);
  });

  test('should keep a segment color change out of the undo history', async ({
    page,
    mainToolbarPageObject,
    rightPanelPageObject,
    viewportPageObject,
  }) => {
    const viewport = await viewportPageObject.active;
    const segment = rightPanelPageObject.labelMapSegmentationPanel.panel.nthSegment(0);
    const unpainted = await canvasDigest(page);

    await viewport.normalizedDragAt(BRUSH_STROKE);
    const painted = await digestAfterChange(page, unpainted, 'Expected the brush stroke to paint');

    await segment.actions.changeColor(NEW_SEGMENT_HEX);
    await expect(segment.rowDataColorHex).toHaveCSS('background-color', NEW_SEGMENT_CSS_RGB);
    const recolored = await digestAfterChange(
      page,
      painted,
      'Expected the stroke to repaint in the new color'
    );

    // Undo skips the color change and takes back the stroke drawn before it.
    await mainToolbarPageObject.undo.click();
    await pollDigest(page, 'Expected undo to clear the stroke').toBe(unpainted);
    await expect(segment.rowDataColorHex).toHaveCSS('background-color', NEW_SEGMENT_CSS_RGB);

    await mainToolbarPageObject.redo.click();
    await pollDigest(page, 'Expected redo to paint in the new color').toBe(recolored);
  });

  test('should undo a brush stroke after the layout changes', async ({
    page,
    mainToolbarPageObject,
    viewportPageObject,
  }) => {
    const viewport = await viewportPageObject.active;
    const unpainted = await canvasDigest(page);

    await viewport.normalizedDragAt(BRUSH_STROKE);
    const painted = await digestAfterChange(page, unpainted, 'Expected the brush stroke to paint');

    await mainToolbarPageObject.layoutSelection.grid(2, 1).click();
    await expect(viewportPageObject.getNthLocator(1)).toBeVisible();
    await waitForViewportPainted({ page });
    const paintedInGrid = await canvasDigest(page);

    await mainToolbarPageObject.undo.click();
    await pollDigest(page, 'Expected undo to clear the stroke').not.toBe(paintedInGrid);

    await mainToolbarPageObject.layoutSelection.grid(1, 1).click();
    await expect(viewportPageObject.getNthLocator(1)).toHaveCount(0);
    await pollDigest(page, 'Expected the stroke to stay undone in 1x1').toBe(unpainted);

    await mainToolbarPageObject.redo.click();
    await pollDigest(page, 'Expected redo to repaint the stroke').toBe(painted);
  });
});

test.describe('contour', () => {
  test.beforeEach(async ({ page, rightPanelPageObject }) => {
    await visitStudy(page, STUDY_UID, 'segmentation', 2000);
    await waitForViewportsRendered(page);

    const { contourSegmentationPanel } = rightPanelPageObject;
    await contourSegmentationPanel.addSegmentation();
    await expect(contourSegmentationPanel.panel.rows).toHaveCount(1);
    await waitForViewportsRendered(page);
  });

  test('should undo and redo a freehand contour', async ({
    page,
    mainToolbarPageObject,
    rightPanelPageObject,
    viewportPageObject,
  }) => {
    const viewport = await viewportPageObject.active;
    const paths = viewport.svg('path');
    await expect(paths).toHaveCount(0);

    await rightPanelPageObject.contourSegmentationPanel.tools.freehandContour.click();
    await viewport.normalizedPathDragAt({ path: CONTOUR_PATH });
    await expect(paths, 'Expected the contour to be drawn').toHaveCount(1);
    await expect(paths.first()).toBeVisible();
    // Read the path once the contour has rendered in its final, closed shape.
    await waitForViewportsRendered(page);
    const drawnPathD = await getSvgAttribute({
      viewportPageObject,
      svgInnerElement: 'path',
      attributeName: 'd',
    });

    await mainToolbarPageObject.undo.click();
    await expect(paths, 'Expected undo to remove the contour').toHaveCount(0);
    await expect(mainToolbarPageObject.undo.button).toBeDisabled();

    await mainToolbarPageObject.redo.click();
    await expect(paths, 'Expected redo to restore the contour').toHaveCount(1);
    await expect(paths.first()).toBeVisible();
    await expect(paths.first()).toHaveAttribute('d', drawnPathD);
  });
});
