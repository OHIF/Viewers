import type { Page } from '@playwright/test';

import type { DOMOverlayPageObject, MainToolbarPageObject, RightPanelPageObject } from './pages';
import type { IViewportPageObject } from './pages/ViewportPageObject';
import {
  expect,
  getAnnotationStats,
  readWhenSettled,
  test,
  visitStudy,
  waitForAnnotationCompleted,
  waitForViewportNotBlank,
} from './utils';
import { expectUndoRedoState } from './utils/assertions';

const STUDY_UID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';

type Point = { x: number; y: number };

type MeasurementTool = {
  name: string;
  select: (mainToolbarPageObject: MainToolbarPageObject) => Promise<void>;
  // Clicks that draw one annotation.
  points: Point[];
  // Text the tool asks for once the annotation is drawn.
  label?: string;
  // A drag from the left-most handle; the text box sits to the right, so the drag can't grab it.
  handleMove: { start: Point; end: Point };
};

// The left-most handle of the circle, ellipse and spline drawn below, dragged further left.
const LEFT_HANDLE_MOVE = { start: { x: 0.44, y: 0.45 }, end: { x: 0.4, y: 0.45 } };

const SPLINE_ROI: MeasurementTool = {
  name: 'SplineROI',
  select: toolbar => toolbar.measurementTools.splineROI.click(),
  // Closes with a quick click near the first point; a held close dismisses the tracking prompt.
  points: [
    { x: 0.44, y: 0.45 },
    { x: 0.5, y: 0.38 },
    { x: 0.57, y: 0.42 },
    { x: 0.55, y: 0.52 },
    { x: 0.48, y: 0.53 },
    { x: 0.442, y: 0.452 },
  ],
  handleMove: LEFT_HANDLE_MOVE,
};

const TOOLS: MeasurementTool[] = [
  {
    name: 'Bidirectional',
    select: toolbar => toolbar.measurementTools.bidirectional.click(),
    points: [
      { x: 0.42, y: 0.4 },
      { x: 0.58, y: 0.5 },
    ],
    handleMove: { start: { x: 0.42, y: 0.4 }, end: { x: 0.37, y: 0.36 } },
  },
  {
    name: 'CircleROI',
    select: toolbar => toolbar.measurementTools.circleROI.click(),
    // The center, then a point on the edge, which is the handle that sets the radius.
    points: [
      { x: 0.5, y: 0.45 },
      { x: 0.44, y: 0.45 },
    ],
    handleMove: LEFT_HANDLE_MOVE,
  },
  {
    name: 'EllipticalROI',
    select: toolbar => toolbar.measurementTools.ellipticalROI.click(),
    // The center, then a corner of the bounding box. The handles sit at the middle of each side.
    points: [
      { x: 0.5, y: 0.45 },
      { x: 0.56, y: 0.5 },
    ],
    handleMove: LEFT_HANDLE_MOVE,
  },
  {
    name: 'RectangleROI',
    select: toolbar => toolbar.measurementTools.rectangleROI.click(),
    points: [
      { x: 0.44, y: 0.4 },
      { x: 0.56, y: 0.5 },
    ],
    handleMove: { start: { x: 0.44, y: 0.4 }, end: { x: 0.4, y: 0.36 } },
  },
  SPLINE_ROI,
  {
    name: 'ArrowAnnotate',
    select: toolbar => toolbar.measurementTools.arrowAnnotate.click(),
    points: [
      { x: 0.42, y: 0.4 },
      { x: 0.56, y: 0.5 },
    ],
    label: 'Undo redo arrow',
    handleMove: { start: { x: 0.42, y: 0.4 }, end: { x: 0.38, y: 0.36 } },
  },
];

async function drawAnnotation(
  page: Page,
  viewport: IViewportPageObject,
  DOMOverlayPageObject: DOMOverlayPageObject,
  tool: MeasurementTool
) {
  await waitForAnnotationCompleted({
    page,
    action: async () => {
      await viewport.normalizedClickAt(tool.points);
      if (tool.label) {
        await DOMOverlayPageObject.dialog.input.fillAndSave(tool.label);
      }
    },
  });
}

// The only annotation as Cornerstone stores it (handle points and cached stats) and as the user
// sees it (panel row, viewport text box, and the end points of every SVG line).
async function annotationSnapshot(
  page: Page,
  rightPanelPageObject: RightPanelPageObject,
  viewport: IViewportPageObject
) {
  const row = rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0);
  const [[annotation], title, panel, textBox, lines] = await Promise.all([
    getAnnotationStats(page, { requireStats: false }),
    row.title.innerText(),
    row.stats.primary.lines.allInnerTexts(),
    viewport.nthAnnotation(0).locator.locator('tspan').allTextContents(),
    viewport
      .svg('line')
      .evaluateAll(elements =>
        elements.map(line => ['x1', 'y1', 'x2', 'y2'].map(n => line.getAttribute(n)).join(','))
      ),
  ]);
  const { points, cachedStats } = annotation;
  return JSON.stringify({ points, cachedStats, title, panel, textBox, lines });
}

// Reads the annotation snapshot either once it stops changing, or by polling it in an assertion.
function snapshotOf(
  page: Page,
  rightPanelPageObject: RightPanelPageObject,
  viewport: IViewportPageObject
) {
  const read = () => annotationSnapshot(page, rightPanelPageObject, viewport);
  return {
    settled: () => readWhenSettled({ read, message: 'Expected the annotation to stop changing' }),
    poll: (message: string) => expect.poll(read, { message }),
  };
}

test.beforeEach(async ({ page, rightPanelPageObject, viewportPageObject }) => {
  await visitStudy(page, STUDY_UID, 'viewer', 2000);
  await waitForViewportNotBlank({ page });

  await rightPanelPageObject.toggle();
  await rightPanelPageObject.measurementsPanel.select();
  await expect(rightPanelPageObject.measurementsPanel.panel.rows).toHaveCount(0);
  await expect((await viewportPageObject.active).annotationShapes).toHaveCount(0);
});

for (const tool of TOOLS) {
  test.describe(tool.name, () => {
    test.beforeEach(
      async ({
        page,
        DOMOverlayPageObject,
        mainToolbarPageObject,
        rightPanelPageObject,
        viewportPageObject,
      }) => {
        const viewport = await viewportPageObject.active;
        await tool.select(mainToolbarPageObject);
        await drawAnnotation(page, viewport, DOMOverlayPageObject, tool);
        await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();
        await expect(rightPanelPageObject.measurementsPanel.panel.rows).toHaveCount(1);
        await expect(viewport.nthAnnotation(0).locator).toBeVisible();
      }
    );

    test('should undo and redo a new annotation', async ({
      page,
      mainToolbarPageObject,
      rightPanelPageObject,
      viewportPageObject,
    }) => {
      // Expected to fail for SplineROI until https://github.com/OHIF/Viewers/issues/6070 is fixed.
      test.fail(tool === SPLINE_ROI);
      const viewport = await viewportPageObject.active;
      const { rows } = rightPanelPageObject.measurementsPanel.panel;
      const snapshot = snapshotOf(page, rightPanelPageObject, viewport);
      const drawn = await snapshot.settled();
      await expectUndoRedoState({ mainToolbarPageObject, undo: true, redo: false });

      await mainToolbarPageObject.undo.click();
      await expect(rows, 'Expected undo to remove the row').toHaveCount(0);
      await expect(viewport.annotationShapes).toHaveCount(0);
      await expectUndoRedoState({ mainToolbarPageObject, undo: false, redo: true });

      await mainToolbarPageObject.redo.click();
      await expect(rows, 'Expected redo to restore the row').toHaveCount(1);
      await expect(viewport.nthAnnotation(0).locator).toBeVisible();
      await snapshot.poll('Expected redo to restore the annotation').toBe(drawn);
      await expectUndoRedoState({ mainToolbarPageObject, undo: true, redo: false });
    });

    test('should undo and redo a handle move', async ({
      page,
      mainToolbarPageObject,
      rightPanelPageObject,
      viewportPageObject,
    }) => {
      const viewport = await viewportPageObject.active;
      const snapshot = snapshotOf(page, rightPanelPageObject, viewport);
      const drawn = await snapshot.settled();

      // Moves 150ms apart, longer than SplineROI's 100ms stats throttle, so its stats reach the
      // final position.
      await viewport.normalizedDragAt({ ...tool.handleMove, config: { delay: 150, steps: 5 } });
      await snapshot.poll('Expected the move to change the annotation').not.toBe(drawn);
      const moved = await snapshot.settled();
      await expectUndoRedoState({ mainToolbarPageObject, undo: true, redo: false });

      await mainToolbarPageObject.undo.click();
      await snapshot.poll('Expected undo to restore the annotation').toBe(drawn);
      await expectUndoRedoState({ mainToolbarPageObject, undo: true, redo: true });

      await mainToolbarPageObject.redo.click();
      await snapshot.poll('Expected redo to move it again').toBe(moved);
      await expectUndoRedoState({ mainToolbarPageObject, undo: true, redo: false });
    });

    test('should undo and redo a delete from the panel', async ({
      page,
      mainToolbarPageObject,
      rightPanelPageObject,
      viewportPageObject,
    }) => {
      const viewport = await viewportPageObject.active;
      const { panel } = rightPanelPageObject.measurementsPanel;
      const snapshot = snapshotOf(page, rightPanelPageObject, viewport);
      const drawn = await snapshot.settled();

      await panel.nthMeasurement(0).actions.delete();
      await expect(panel.rows).toHaveCount(0);
      await expect(viewport.annotationShapes).toHaveCount(0);
      await expectUndoRedoState({ mainToolbarPageObject, undo: true, redo: false });

      await mainToolbarPageObject.undo.click();
      await expect(panel.rows, 'Expected undo to bring the row back').toHaveCount(1);
      await expect(viewport.nthAnnotation(0).locator).toBeVisible();
      await snapshot.poll('Expected undo to restore the annotation').toBe(drawn);
      await expectUndoRedoState({ mainToolbarPageObject, undo: true, redo: true });

      await mainToolbarPageObject.redo.click();
      await expect(panel.rows, 'Expected redo to delete the row again').toHaveCount(0);
      await expect(viewport.annotationShapes).toHaveCount(0);
      await expectUndoRedoState({ mainToolbarPageObject, undo: true, redo: false });
    });
  });
}
