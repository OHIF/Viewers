import type { Page } from '@playwright/test';

import type {
  DOMOverlayPageObject,
  MainToolbarPageObject,
  RightPanelPageObject,
  ViewportPageObject,
} from './pages';
import type { IViewportPageObject } from './pages/ViewportPageObject';
import {
  expect,
  test,
  visitStudy,
  waitForAnnotationCompleted,
  waitForViewportNotBlank,
} from './utils';
import { expectUndoRedoEnabled } from './utils/assertions';

const STUDY_UID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';

type Point = { x: number; y: number };

type MeasurementTool = {
  name: string;
  select: (mainToolbarPageObject: MainToolbarPageObject) => Promise<void>;
  // Clicks that draw one annotation.
  points: Point[];
  // Text the tool asks for once the annotation is drawn.
  label?: string;
  // Drags the annotation's left-most handle, so the drag can't start on the text box, which
  // Cornerstone places to the right of the annotation.
  handleMove: { start: Point; end: Point };
};

type NewAnnotationFixtures = {
  mainToolbarPageObject: MainToolbarPageObject;
  rightPanelPageObject: RightPanelPageObject;
  viewportPageObject: ViewportPageObject;
};

const SPLINE_ROI: MeasurementTool = {
  name: 'SplineROI',
  select: toolbar => toolbar.measurementTools.splineROI.click(),
  // The last click lands next to the first point, which closes the spline.
  points: [
    { x: 0.44, y: 0.45 },
    { x: 0.5, y: 0.38 },
    { x: 0.57, y: 0.42 },
    { x: 0.55, y: 0.52 },
    { x: 0.48, y: 0.53 },
    { x: 0.442, y: 0.452 },
  ],
  handleMove: { start: { x: 0.44, y: 0.45 }, end: { x: 0.4, y: 0.45 } },
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
    handleMove: { start: { x: 0.44, y: 0.45 }, end: { x: 0.4, y: 0.45 } },
  },
  {
    name: 'EllipticalROI',
    select: toolbar => toolbar.measurementTools.ellipticalROI.click(),
    // The center, then a corner of the bounding box. The handles sit at the middle of each side.
    points: [
      { x: 0.5, y: 0.45 },
      { x: 0.56, y: 0.5 },
    ],
    handleMove: { start: { x: 0.44, y: 0.45 }, end: { x: 0.4, y: 0.45 } },
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

// What the user sees of the only annotation: its panel row, its viewport text box (stats or
// label) and the end points of every SVG line, which covers arrow and bidirectional shafts.
async function annotationSnapshot(
  rightPanelPageObject: RightPanelPageObject,
  viewport: IViewportPageObject
) {
  const row = rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0);
  const lines = await viewport
    .svg('line')
    .evaluateAll(elements =>
      elements.map(line => ['x1', 'y1', 'x2', 'y2'].map(name => line.getAttribute(name)).join(','))
    );
  return JSON.stringify({
    title: await row.title.innerText(),
    panel: await row.stats.primary.lines.allInnerTexts(),
    textBox: await viewport.nthAnnotation(0).locator.locator('tspan').allTextContents(),
    lines,
  });
}

// Reads the snapshot once two reads 500ms apart agree, so stats still updating aren't captured.
async function settledSnapshot(
  rightPanelPageObject: RightPanelPageObject,
  viewport: IViewportPageObject
) {
  let previous: string | undefined;
  await expect
    .poll(
      async () => {
        const current = await annotationSnapshot(rightPanelPageObject, viewport);
        const settled = current === previous;
        previous = current;
        return settled;
      },
      { intervals: [500], message: 'Expected the annotation to stop changing' }
    )
    .toBe(true);
  return previous as string;
}

function pollSnapshot(
  rightPanelPageObject: RightPanelPageObject,
  viewport: IViewportPageObject,
  message: string
) {
  return expect.poll(() => annotationSnapshot(rightPanelPageObject, viewport), { message });
}

// Checks that one undo removes the drawn annotation and its row with nothing left to undo, and
// that one redo brings back the same annotation.
async function undoRedoNewAnnotation({
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}: NewAnnotationFixtures) {
  const viewport = await viewportPageObject.active;
  const { rows } = rightPanelPageObject.measurementsPanel.panel;
  const drawn = await settledSnapshot(rightPanelPageObject, viewport);
  await expectUndoRedoEnabled({ mainToolbarPageObject, undo: true, redo: false });

  await mainToolbarPageObject.undo.click();
  await expect(rows, 'Expected undo to remove the row').toHaveCount(0);
  await expect(viewport.nthAnnotation(0).locator).toHaveCount(0);
  await expectUndoRedoEnabled({ mainToolbarPageObject, undo: false, redo: true });

  await mainToolbarPageObject.redo.click();
  await expect(rows, 'Expected redo to restore the row').toHaveCount(1);
  await pollSnapshot(rightPanelPageObject, viewport, 'Expected redo to restore it').toBe(drawn);
  await expectUndoRedoEnabled({ mainToolbarPageObject, undo: true, redo: false });
}

test.beforeEach(async ({ page, rightPanelPageObject, viewportPageObject }) => {
  await visitStudy(page, STUDY_UID, 'viewer', 2000);
  await waitForViewportNotBlank({ page });

  await rightPanelPageObject.toggle();
  await rightPanelPageObject.measurementsPanel.select();
  await expect(rightPanelPageObject.measurementsPanel.panel.rows).toHaveCount(0);
  const viewport = await viewportPageObject.active;
  await expect(viewport.nthAnnotation(0).locator).toHaveCount(0);
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

    if (tool === SPLINE_ROI) {
      // Expected to fail until https://github.com/OHIF/Viewers/issues/6070 is fixed.
      test.fail(
        'should undo and redo a new annotation',
        async ({ mainToolbarPageObject, rightPanelPageObject, viewportPageObject }) => {
          await undoRedoNewAnnotation({
            mainToolbarPageObject,
            rightPanelPageObject,
            viewportPageObject,
          });
        }
      );
    } else {
      test('should undo and redo a new annotation', async ({
        mainToolbarPageObject,
        rightPanelPageObject,
        viewportPageObject,
      }) => {
        await undoRedoNewAnnotation({
          mainToolbarPageObject,
          rightPanelPageObject,
          viewportPageObject,
        });
      });
    }

    test('should undo and redo a handle move', async ({
      mainToolbarPageObject,
      rightPanelPageObject,
      viewportPageObject,
    }) => {
      const viewport = await viewportPageObject.active;
      const drawn = await settledSnapshot(rightPanelPageObject, viewport);

      await viewport.normalizedDragAt({ ...tool.handleMove, config: { delay: 150, steps: 5 } });
      await pollSnapshot(rightPanelPageObject, viewport, 'Expected the move to change it').not.toBe(
        drawn
      );
      const moved = await settledSnapshot(rightPanelPageObject, viewport);
      await expectUndoRedoEnabled({ mainToolbarPageObject, undo: true, redo: false });

      await mainToolbarPageObject.undo.click();
      await pollSnapshot(rightPanelPageObject, viewport, 'Expected undo to restore it').toBe(drawn);
      await expectUndoRedoEnabled({ mainToolbarPageObject, undo: true, redo: true });

      await mainToolbarPageObject.redo.click();
      await pollSnapshot(rightPanelPageObject, viewport, 'Expected redo to move it again').toBe(
        moved
      );
      await expectUndoRedoEnabled({ mainToolbarPageObject, undo: true, redo: false });
    });

    test('should undo and redo a delete from the panel', async ({
      mainToolbarPageObject,
      rightPanelPageObject,
      viewportPageObject,
    }) => {
      const viewport = await viewportPageObject.active;
      const { panel } = rightPanelPageObject.measurementsPanel;
      const drawn = await settledSnapshot(rightPanelPageObject, viewport);

      await panel.nthMeasurement(0).actions.delete();
      await expect(panel.rows).toHaveCount(0);
      await expect(viewport.nthAnnotation(0).locator).toHaveCount(0);

      await mainToolbarPageObject.undo.click();
      await expect(panel.rows, 'Expected undo to bring the row back').toHaveCount(1);
      await pollSnapshot(rightPanelPageObject, viewport, 'Expected undo to restore it').toBe(drawn);
      await expectUndoRedoEnabled({ mainToolbarPageObject, undo: true, redo: true });

      await mainToolbarPageObject.redo.click();
      await expect(panel.rows, 'Expected redo to delete the row again').toHaveCount(0);
      await expect(viewport.nthAnnotation(0).locator).toHaveCount(0);
    });
  });
}
