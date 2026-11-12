import {
  expect,
  getAnnotationStats,
  subscribeToMeasurementAdded,
  test,
  visitStudy,
} from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should not fire MEASUREMENT_ADDED when clicking the annotation text', async ({
  page,
  DOMOverlayPageObject,
  mainToolbarPageObject,
  viewportPageObject,
}) => {
  await mainToolbarPageObject.measurementTools.freehandROI.click();
  const activeViewport = await viewportPageObject.active;
  await activeViewport.normalizedDragAt({
    start: { x: 0.35, y: 0.35 },
    end: { x: 0.6, y: 0.55 },
    config: { steps: 20, delay: 30 },
  });

  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();

  const measurementAdded = await subscribeToMeasurementAdded(page);
  try {
    const annotation = activeViewport.nthAnnotation(0);
    await annotation.text.click();

    await expect(measurementAdded.waitFired(1000)).rejects.toThrow();
  } finally {
    await measurementAdded.unsubscribe();
  }
});

test('rectangle and freehand at identical coordinates should yield comparable area', async ({
  page,
  DOMOverlayPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  // Open measurements panel first — needed later for the delete action, and
  // opening up-front means both shapes are drawn against the same viewport
  // layout (so normalized coords don't shift between draws).
  await rightPanelPageObject.toggle();
  await rightPanelPageObject.measurementsPanel.select();

  const activeViewport = await viewportPageObject.active;

  // End on the left edge just shy of the start so cornerstone3D's proximity-
  // close triggers via the standard mouseup path (which fires
  // ANNOTATION_COMPLETED). Ending at the start point would enter interactive close-
  // preview mode and suppress the completion event; ending further away
  // would draw a diagonal that distorts the rectangular shape.
  //
  // The closing gap must be a fixed number of canvas pixels, not a normalized
  // fraction: cs3d's close-proximity threshold is in pixels, so a fractional gap
  // (0.01 × height) grew past the threshold on taller CI viewports and the
  // contour never auto-closed (intermittent "no cachedStats"). Derive it from the
  // viewport bbox so the gap is viewport-size-independent.
  const CLOSE_GAP_PX = 6;
  const viewportBox = await activeViewport.pane.boundingBox();
  if (!viewportBox) {
    throw new Error('Active viewport bounding box not found');
  }
  const closeY = 0.3 + CLOSE_GAP_PX / viewportBox.height;

  const corners = [
    { x: 0.3, y: 0.3 },
    { x: 0.55, y: 0.3 },
    { x: 0.55, y: 0.55 },
    { x: 0.3, y: 0.55 },
    { x: 0.3, y: closeY },
  ];
  const [topLeft, , bottomRight] = corners;

  await mainToolbarPageObject.measurementTools.rectangleROI.click();
  await activeViewport.normalizedClickAt([topLeft, bottomRight]);
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();

  const rectangles = await getAnnotationStats(page, { toolName: 'RectangleROI' });
  const rectArea = rectangles[0].firstTargetStats!.area as number;
  const rectRow = rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0);
  const rectSvgLines = activeViewport.getSvgAnnotationStatTextLines(rectangles[0].annotationUID);
  await expect(rectSvgLines.nth(0)).toHaveText(`Area: ${Math.round(rectArea)} mm²`);
  await expect(rectRow.stats.primary.lines.nth(0)).toHaveText(`${Math.round(rectArea)} mm²`);

  // Remove the rectangle so the freehand can drag through the same coords
  // without grabbing the rectangle's handles.
  await rectRow.actions.delete();

  await mainToolbarPageObject.measurementTools.freehandROI.click();
  await activeViewport.normalizedPathDragAt({
    path: corners,
    config: { steps: 20, delay: 30 },
  });

  const freehands = await getAnnotationStats(page, { toolName: 'PlanarFreehandROI' });
  const freehandArea = freehands[0].firstTargetStats!.area as number;
  const freehandRow = rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0);
  const freehandSvgLines = activeViewport.getSvgAnnotationStatTextLines(freehands[0].annotationUID);
  await expect(freehandSvgLines.nth(0)).toHaveText(`Area: ${Math.round(freehandArea)} mm²`);
  await expect(freehandRow.stats.primary.lines.nth(0)).toHaveText(`${Math.round(freehandArea)} mm²`);

  const pctDiff = (Math.abs(rectArea - freehandArea) / rectArea) * 100;
  console.log(
    `Rectangle: ${rectArea.toFixed(2)} mm² | ` +
      `Freehand:  ${freehandArea.toFixed(2)} mm² | ` +
      `diff: ${pctDiff.toFixed(2)}%`
  );

  // The rectangle area derives from two exact corner coordinates, but the
  // freehand area is a shoelace sum over ~80 sampled mouse points whose canvas
  // coordinates are rounded to integer pixels. For a box this size that
  // accumulated rounding noise is ~1% — right at a strict 1% threshold, which
  // made this assertion sit on the knife's edge and flake. 2% leaves margin for
  // the rounding floor while still catching real unit/area-calculation bugs.
  expect(pctDiff).toBeLessThan(2);
});
