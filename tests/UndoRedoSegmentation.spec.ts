import type { Page } from '@playwright/test';

import {
  expect,
  getSvgAttribute,
  getViewportCanvasStats,
  test,
  visitStudy,
  waitForViewportRenderCycle,
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

async function withRenderCycle(page: Page, action: () => Promise<void>) {
  const renderCycle = waitForViewportRenderCycle(page);
  await action();
  await renderCycle;
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

  test('undoes and redoes a brush stroke', async ({
    page,
    mainToolbarPageObject,
    viewportPageObject,
  }) => {
    const viewport = await viewportPageObject.active;
    const unpainted = await canvasDigest(page);

    await withRenderCycle(page, () => viewport.normalizedDragAt(BRUSH_STROKE));
    const painted = await canvasDigest(page);
    expect(painted, 'Expected the brush stroke to paint the viewport').not.toBe(unpainted);

    await withRenderCycle(page, () => mainToolbarPageObject.undo.click());
    expect(await canvasDigest(page), 'Expected undo to clear the stroke').toBe(unpainted);
    await expect(mainToolbarPageObject.undo.button).toBeDisabled();

    await withRenderCycle(page, () => mainToolbarPageObject.redo.click());
    expect(await canvasDigest(page), 'Expected redo to repaint the stroke').toBe(painted);
    await expect(mainToolbarPageObject.redo.button).toBeDisabled();
  });

  test('undoes an eraser stroke, then the brush stroke under it', async ({
    page,
    mainToolbarPageObject,
    rightPanelPageObject,
    viewportPageObject,
  }) => {
    const viewport = await viewportPageObject.active;
    const unpainted = await canvasDigest(page);

    await withRenderCycle(page, () => viewport.normalizedDragAt(BRUSH_STROKE));
    const painted = await canvasDigest(page);

    await rightPanelPageObject.labelMapSegmentationPanel.tools.eraser.click();
    await withRenderCycle(page, () => viewport.normalizedDragAt(ERASER_STROKE));
    const erased = await canvasDigest(page);
    expect(erased, 'Expected the eraser to remove part of the stroke').not.toBe(painted);
    expect(erased, 'Expected the eraser to leave the rest of the stroke').not.toBe(unpainted);

    await withRenderCycle(page, () => mainToolbarPageObject.undo.click());
    expect(await canvasDigest(page), 'Expected undo to restore the erased part').toBe(painted);

    await withRenderCycle(page, () => mainToolbarPageObject.undo.click());
    expect(await canvasDigest(page), 'Expected a second undo to clear the stroke').toBe(unpainted);
  });

  test('undoes and redoes a segment delete', async ({
    page,
    mainToolbarPageObject,
    rightPanelPageObject,
    viewportPageObject,
  }) => {
    const viewport = await viewportPageObject.active;
    const { panel } = rightPanelPageObject.labelMapSegmentationPanel;
    const unpainted = await canvasDigest(page);

    await withRenderCycle(page, () => viewport.normalizedDragAt(BRUSH_STROKE));
    const painted = await canvasDigest(page);
    const segmentName = await panel.nthSegment(0).title.innerText();

    await withRenderCycle(page, () => panel.nthSegment(0).actions.delete());
    await expect(panel.rows).toHaveCount(0);
    expect(await canvasDigest(page), 'Expected the delete to clear its pixels').toBe(unpainted);

    await withRenderCycle(page, () => mainToolbarPageObject.undo.click());
    await expect(panel.rows, 'Expected undo to restore the segment row').toHaveCount(1);
    await expect(panel.nthSegment(0).title).toHaveText(segmentName);
    expect(await canvasDigest(page), 'Expected undo to restore its pixels').toBe(painted);

    await withRenderCycle(page, () => mainToolbarPageObject.redo.click());
    await expect(panel.rows, 'Expected redo to delete the segment again').toHaveCount(0);
    expect(await canvasDigest(page)).toBe(unpainted);
  });

  test('keeps a segment color change out of the undo history', async ({
    page,
    mainToolbarPageObject,
    rightPanelPageObject,
    viewportPageObject,
  }) => {
    const viewport = await viewportPageObject.active;
    const segment = rightPanelPageObject.labelMapSegmentationPanel.panel.nthSegment(0);
    const unpainted = await canvasDigest(page);

    await withRenderCycle(page, () => viewport.normalizedDragAt(BRUSH_STROKE));
    const painted = await canvasDigest(page);

    await withRenderCycle(page, () => segment.actions.changeColor(NEW_SEGMENT_HEX));
    await expect(segment.rowDataColorHex).toHaveCSS('background-color', NEW_SEGMENT_CSS_RGB);
    const recolored = await canvasDigest(page);
    expect(recolored, 'Expected the stroke to repaint in the new color').not.toBe(painted);

    // Undo skips the color change and takes back the stroke drawn before it.
    await withRenderCycle(page, () => mainToolbarPageObject.undo.click());
    expect(await canvasDigest(page), 'Expected undo to clear the stroke').toBe(unpainted);
    await expect(segment.rowDataColorHex).toHaveCSS('background-color', NEW_SEGMENT_CSS_RGB);

    await withRenderCycle(page, () => mainToolbarPageObject.redo.click());
    expect(await canvasDigest(page), 'Expected redo to paint in the new color').toBe(recolored);
  });

  test('undoes a brush stroke after the layout changes', async ({
    page,
    mainToolbarPageObject,
    viewportPageObject,
  }) => {
    const viewport = await viewportPageObject.active;
    const unpainted = await canvasDigest(page);

    await withRenderCycle(page, () => viewport.normalizedDragAt(BRUSH_STROKE));
    const painted = await canvasDigest(page);

    await mainToolbarPageObject.layoutSelection.grid(2, 1).click();
    await expect(viewportPageObject.getNthLocator(1)).toBeVisible();
    await waitForViewportsRendered(page);
    const paintedInGrid = await canvasDigest(page);

    await withRenderCycle(page, () => mainToolbarPageObject.undo.click());
    expect(await canvasDigest(page), 'Expected undo to clear the stroke').not.toBe(paintedInGrid);

    await mainToolbarPageObject.layoutSelection.grid(1, 1).click();
    await expect(viewportPageObject.getNthLocator(1)).toHaveCount(0);
    await waitForViewportsRendered(page);
    expect(await canvasDigest(page), 'Expected the stroke to stay undone in 1x1').toBe(unpainted);

    await withRenderCycle(page, () => mainToolbarPageObject.redo.click());
    expect(await canvasDigest(page), 'Expected redo to repaint the stroke').toBe(painted);
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

  test('undoes and redoes a freehand contour', async ({
    mainToolbarPageObject,
    rightPanelPageObject,
    viewportPageObject,
  }) => {
    const viewport = await viewportPageObject.active;
    const paths = viewport.svg('path');

    await rightPanelPageObject.contourSegmentationPanel.tools.freehandContour.click();
    await viewport.normalizedPathDragAt({ path: CONTOUR_PATH });
    await expect(paths, 'Expected the contour to be drawn').toHaveCount(1);
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
    await expect(paths.first()).toHaveAttribute('d', drawnPathD);
  });
});
