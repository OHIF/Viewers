import { drawFreehandContour, expect, test, visitStudy, waitForViewportsRendered } from './utils';
import type { Page } from '@playwright/test';
import type { RightPanelPageObject } from './pages';
import type { IViewportPageObject } from './pages/ViewportPageObject';

const studyInstanceUID = '1.3.12.2.1107.5.2.32.35162.30000015050317233592200000046';
const mode = 'segmentation';

// Contour style defaults for a panel-created segmentation, from the cornerstone extension.
const defaultFillOpacity = '0.5';
const defaultInactiveFillOpacity = '0.4';
const defaultOutlineWidth = '1';

// Color of the first segment: the first entry of the cornerstone color LUT.
const defaultSegmentColor = 'rgb(221, 84, 84)';

const dragShape = [
  { x: 0.4, y: 0.4 },
  { x: 0.6, y: 0.4 },
  { x: 0.6, y: 0.6 },
  { x: 0.4, y: 0.6 },
  { x: 0.4, y: 0.4 },
];

const secondDragShape = [
  { x: 0.65, y: 0.15 },
  { x: 0.85, y: 0.15 },
  { x: 0.85, y: 0.35 },
  { x: 0.65, y: 0.35 },
  { x: 0.65, y: 0.15 },
];

/**
 * Draws a freehand contour into the active segment of an empty viewport and returns its SVG path.
 */
async function drawFirstContour({
  contourPanel,
  viewport,
}: {
  contourPanel: RightPanelPageObject['contourSegmentationPanel'];
  viewport: IViewportPageObject;
}) {
  const paths = viewport.svg('path');

  await expect(paths, 'Expected the starting number of paths to be 0').toHaveCount(0);
  await drawFreehandContour({ segmentationPanel: contourPanel, viewport, path: dragShape });
  await expect(paths, 'Expected the freehand contour to be added').toHaveCount(1);

  const contourPath = paths.nth(0);
  await expect(contourPath, 'Expected the drawn contour to be visible').toBeVisible();

  return contourPath;
}

/**
 * Draws a contour into the segmentation created by the beforeEach hook, then creates a second
 * segmentation and draws a contour into it. The second segmentation is left active.
 */
async function drawContoursInTwoSegmentations({
  page,
  contourPanel,
  viewport,
}: {
  page: Page;
  contourPanel: RightPanelPageObject['contourSegmentationPanel'];
  viewport: IViewportPageObject;
}) {
  const paths = viewport.svg('path');

  await expect(paths, 'Expected the starting number of paths to be 0').toHaveCount(0);
  await drawFreehandContour({ segmentationPanel: contourPanel, viewport, path: dragShape });
  await expect(paths, 'Expected the first contour to be added').toHaveCount(1);

  await contourPanel.panel.moreMenu.createNewSegmentation();
  await expect(
    contourPanel.segmentationSelect.selectedValue,
    'Expected the second segmentation to be active'
  ).toHaveText('Segmentation 2');
  await waitForViewportsRendered(page);

  await drawFreehandContour({ segmentationPanel: contourPanel, viewport, path: secondDragShape });
  await expect(paths, 'Expected the second contour to be added').toHaveCount(2);

  return { paths, inactiveContourPath: paths.nth(0), activeContourPath: paths.nth(1) };
}

test.beforeEach(async ({ page, rightPanelPageObject }) => {
  await visitStudy(page, studyInstanceUID, mode, 2000);
  await waitForViewportsRendered(page);

  const contourPanel = rightPanelPageObject.contourSegmentationPanel;
  await contourPanel.addSegmentation();
  await expect(contourPanel.panel.rows, 'Expected the default segment row').toHaveCount(1);
  await waitForViewportsRendered(page);

  // Expand the config section so the tests can assert on its controls.
  await contourPanel.config.open();
});

test('should render a panel-created contour with both fill and outline by default', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourPanel = rightPanelPageObject.contourSegmentationPanel;
  const { display } = contourPanel.config;
  const activeViewport = await viewportPageObject.active;
  const contourPath = await drawFirstContour({ contourPanel, viewport: activeViewport });

  await expect(
    display.fillAndOutline.button,
    'Expected the panel to start in fill & outline mode'
  ).toHaveAttribute('data-state', 'active');
  await expect(contourPath, 'Expected the fill at the default alpha').toHaveAttribute(
    'fill-opacity',
    defaultFillOpacity
  );
  await expect(contourPath, 'Expected the outline at the default width').toHaveAttribute(
    'stroke-width',
    defaultOutlineWidth
  );
  await expect(contourPath, 'Expected the fill to use the segment color').toHaveAttribute(
    'fill',
    defaultSegmentColor
  );
});

test('should toggle fill and outline rendering when switching display modes', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourPanel = rightPanelPageObject.contourSegmentationPanel;
  const { display } = contourPanel.config;
  const activeViewport = await viewportPageObject.active;
  const contourPath = await drawFirstContour({ contourPanel, viewport: activeViewport });

  await display.outline.click();
  await expect(display.outline.button, 'Expected the panel to be in outline mode').toHaveAttribute(
    'data-state',
    'active'
  );
  await expect(contourPath, 'Expected outline mode to hide the fill').toHaveAttribute(
    'fill-opacity',
    '0'
  );
  await expect(contourPath, 'Expected outline mode to keep the outline').toHaveAttribute(
    'stroke-width',
    defaultOutlineWidth
  );

  await display.fill.click();
  await expect(display.fill.button, 'Expected the panel to be in fill mode').toHaveAttribute(
    'data-state',
    'active'
  );
  await expect(contourPath, 'Expected fill mode to restore the fill').toHaveAttribute(
    'fill-opacity',
    defaultFillOpacity
  );
  await expect(contourPath, 'Expected fill mode to hide the outline').toHaveAttribute(
    'stroke-width',
    '0'
  );

  await display.fillAndOutline.click();
  await expect(
    display.fillAndOutline.button,
    'Expected the panel to be in fill & outline mode'
  ).toHaveAttribute('data-state', 'active');
  await expect(contourPath, 'Expected fill & outline mode to render the fill').toHaveAttribute(
    'fill-opacity',
    defaultFillOpacity
  );
  await expect(contourPath, 'Expected fill & outline mode to render the outline').toHaveAttribute(
    'stroke-width',
    defaultOutlineWidth
  );
});

test('should apply a display mode to contours drawn afterwards and re-render existing ones', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourPanel = rightPanelPageObject.contourSegmentationPanel;
  const { display } = contourPanel.config;
  const panel = contourPanel.panel;
  const activeViewport = await viewportPageObject.active;
  const paths = activeViewport.svg('path');

  await expect(paths, 'Expected the starting number of paths to be 0').toHaveCount(0);

  // Select outline-only before anything is drawn.
  await display.outline.click();
  await expect(display.outline.button, 'Expected the panel to be in outline mode').toHaveAttribute(
    'data-state',
    'active'
  );

  await drawFreehandContour({
    segmentationPanel: contourPanel,
    viewport: activeViewport,
    path: dragShape,
  });
  await expect(paths, 'Expected the first freehand contour to be added').toHaveCount(1);

  await contourPanel.addSegmentButton.click();
  await expect(panel.rows, 'Expected a second segment row to be added').toHaveCount(2);
  await panel.nthSegment(1).click();
  // Wait for the segment selection to render so the next contour lands in the second segment.
  await waitForViewportsRendered(page);

  await drawFreehandContour({
    segmentationPanel: contourPanel,
    viewport: activeViewport,
    path: secondDragShape,
  });
  await expect(paths, 'Expected the second freehand contour to be added').toHaveCount(2);
  await expect(paths.nth(0), 'Expected the first contour to be visible').toBeVisible();
  await expect(paths.nth(1), 'Expected the second contour to be visible').toBeVisible();

  await expect(paths.nth(0), 'Expected the first contour without fill').toHaveAttribute(
    'fill-opacity',
    '0'
  );
  await expect(paths.nth(1), 'Expected the second contour without fill').toHaveAttribute(
    'fill-opacity',
    '0'
  );

  // Switching back must re-render both existing contours with a fill.
  await display.fillAndOutline.click();
  await expect(paths.nth(0), 'Expected the first contour to regain its fill').toHaveAttribute(
    'fill-opacity',
    defaultFillOpacity
  );
  await expect(paths.nth(1), 'Expected the second contour to regain its fill').toHaveAttribute(
    'fill-opacity',
    defaultFillOpacity
  );
});

test('should change the contour fill opacity when the opacity value is typed in', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourPanel = rightPanelPageObject.contourSegmentationPanel;
  const { opacity, display } = contourPanel.config;
  const activeViewport = await viewportPageObject.active;
  const contourPath = await drawFirstContour({ contourPanel, viewport: activeViewport });

  await expect(opacity.numberInput, 'Expected default opacity').toHaveValue(defaultFillOpacity);
  await expect(contourPath, 'Expected the fill at the default alpha').toHaveAttribute(
    'fill-opacity',
    defaultFillOpacity
  );

  await opacity.setValue('0.3');
  await expect(opacity.numberInput, 'Expected the opacity input to accept 0.3').toHaveValue('0.3');
  await expect(contourPath, 'Expected the fill to render at 0.3 alpha').toHaveAttribute(
    'fill-opacity',
    '0.3'
  );

  await opacity.setValue('1');
  await expect(contourPath, 'Expected the fill to render fully opaque').toHaveAttribute(
    'fill-opacity',
    '1'
  );

  await opacity.setValue('0');
  await expect(contourPath, 'Expected the fill to render fully transparent').toHaveAttribute(
    'fill-opacity',
    '0'
  );
  // Zero opacity hides the fill without turning the fill display off.
  await expect(
    display.fillAndOutline.button,
    'Expected the panel to stay in fill & outline mode'
  ).toHaveAttribute('data-state', 'active');
  await expect(contourPath, 'Expected the outline to be unaffected by opacity').toHaveAttribute(
    'stroke-width',
    defaultOutlineWidth
  );
});

test('should change the contour outline width when the border value is typed in', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourPanel = rightPanelPageObject.contourSegmentationPanel;
  const { border } = contourPanel.config;
  const activeViewport = await viewportPageObject.active;
  const contourPath = await drawFirstContour({ contourPanel, viewport: activeViewport });

  await expect(border.numberInput, 'Expected default border').toHaveValue(defaultOutlineWidth);
  await expect(contourPath, 'Expected the outline at the default width').toHaveAttribute(
    'stroke-width',
    defaultOutlineWidth
  );

  await border.setValue('5');
  await expect(border.numberInput, 'Expected the border input to accept 5').toHaveValue('5');
  await expect(contourPath, 'Expected the outline to render 5px wide').toHaveAttribute(
    'stroke-width',
    '5'
  );
  await expect(contourPath, 'Expected the fill to be unaffected by border').toHaveAttribute(
    'fill-opacity',
    defaultFillOpacity
  );

  await border.setValue('0');
  await expect(contourPath, 'Expected a zero border to hide the outline').toHaveAttribute(
    'stroke-width',
    '0'
  );
});

test('should keep the fill hidden in outline mode until fill display is re-enabled', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourPanel = rightPanelPageObject.contourSegmentationPanel;
  const { opacity, display } = contourPanel.config;
  const activeViewport = await viewportPageObject.active;
  const contourPath = await drawFirstContour({ contourPanel, viewport: activeViewport });

  await display.outline.click();
  await expect(display.outline.button, 'Expected the panel to be in outline mode').toHaveAttribute(
    'data-state',
    'active'
  );
  await expect(contourPath, 'Expected outline mode to hide the fill').toHaveAttribute(
    'fill-opacity',
    '0'
  );

  // Changing the opacity while the fill is hidden must not reveal it.
  await opacity.setValue('0.8');
  await expect(opacity.numberInput, 'Expected the opacity input to accept 0.8').toHaveValue('0.8');
  await expect(contourPath, 'Expected the fill to stay hidden in outline mode').toHaveAttribute(
    'fill-opacity',
    '0'
  );
  await expect(contourPath, 'Expected the outline to keep rendering').toHaveAttribute(
    'stroke-width',
    defaultOutlineWidth
  );

  // Re-enabling the fill applies the opacity chosen while it was hidden.
  await display.fillAndOutline.click();
  await expect(contourPath, 'Expected the fill to return at the new alpha').toHaveAttribute(
    'fill-opacity',
    '0.8'
  );
});

test('should render the inactive segmentation contour at the inactive fill opacity', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourPanel = rightPanelPageObject.contourSegmentationPanel;
  const { opacity, opacityInactive } = contourPanel.config;
  const activeViewport = await viewportPageObject.active;
  const { inactiveContourPath, activeContourPath } = await drawContoursInTwoSegmentations({
    page,
    contourPanel,
    viewport: activeViewport,
  });

  await expect(opacity.numberInput, 'Expected default opacity').toHaveValue(defaultFillOpacity);
  await expect(opacityInactive.numberInput, 'Expected default inactive opacity').toHaveValue(
    defaultInactiveFillOpacity
  );
  await expect(activeContourPath, 'Expected the active contour at the fill alpha').toHaveAttribute(
    'fill-opacity',
    defaultFillOpacity
  );
  await expect(
    inactiveContourPath,
    'Expected the inactive contour at the inactive fill alpha'
  ).toHaveAttribute('fill-opacity', defaultInactiveFillOpacity);
});

test('should apply the inactive opacity value to the inactive segmentation contour only', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourPanel = rightPanelPageObject.contourSegmentationPanel;
  const { opacity, opacityInactive } = contourPanel.config;
  const activeViewport = await viewportPageObject.active;
  const { inactiveContourPath, activeContourPath } = await drawContoursInTwoSegmentations({
    page,
    contourPanel,
    viewport: activeViewport,
  });

  await opacityInactive.setValue('0.2');
  await expect(inactiveContourPath, 'Expected the inactive fill at 0.2 alpha').toHaveAttribute(
    'fill-opacity',
    '0.2'
  );
  await expect(activeContourPath, 'Expected the active fill unchanged').toHaveAttribute(
    'fill-opacity',
    defaultFillOpacity
  );

  // The active opacity must not leak into the inactive contour either.
  await opacity.setValue('0.8');
  await expect(activeContourPath, 'Expected the active fill at 0.8 alpha').toHaveAttribute(
    'fill-opacity',
    '0.8'
  );
  await expect(inactiveContourPath, 'Expected the inactive fill unchanged').toHaveAttribute(
    'fill-opacity',
    '0.2'
  );
});

test('should swap the contour fill opacities when the active segmentation changes', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourPanel = rightPanelPageObject.contourSegmentationPanel;
  const { segmentationSelect } = contourPanel;
  const activeViewport = await viewportPageObject.active;
  const { inactiveContourPath, activeContourPath } = await drawContoursInTwoSegmentations({
    page,
    contourPanel,
    viewport: activeViewport,
  });

  await segmentationSelect.selectNthSegmentation(0);
  await expect(segmentationSelect.selectedValue, 'Expected the first segmentation').toHaveText(
    'Segmentation 1'
  );
  await expect(inactiveContourPath, 'Expected the first contour at the fill alpha').toHaveAttribute(
    'fill-opacity',
    defaultFillOpacity
  );
  await expect(
    activeContourPath,
    'Expected the second contour at the inactive fill alpha'
  ).toHaveAttribute('fill-opacity', defaultInactiveFillOpacity);
});

test('should hide the fill of the inactive segmentation contour in outline mode', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourPanel = rightPanelPageObject.contourSegmentationPanel;
  const { display } = contourPanel.config;
  const activeViewport = await viewportPageObject.active;
  const { inactiveContourPath, activeContourPath } = await drawContoursInTwoSegmentations({
    page,
    contourPanel,
    viewport: activeViewport,
  });

  await display.outline.click();
  await expect(inactiveContourPath, 'Expected the inactive fill hidden').toHaveAttribute(
    'fill-opacity',
    '0'
  );
  await expect(activeContourPath, 'Expected the active fill hidden').toHaveAttribute(
    'fill-opacity',
    '0'
  );

  await display.fillAndOutline.click();
  await expect(
    inactiveContourPath,
    'Expected the inactive fill back at the inactive alpha'
  ).toHaveAttribute('fill-opacity', defaultInactiveFillOpacity);
  await expect(activeContourPath, 'Expected the active fill back at the alpha').toHaveAttribute(
    'fill-opacity',
    defaultFillOpacity
  );
});

test('should hide the inactive segmentation contour when inactive display is turned off', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourPanel = rightPanelPageObject.contourSegmentationPanel;
  const { renderInactiveSegmentations } = contourPanel.config;
  const activeViewport = await viewportPageObject.active;
  const { paths } = await drawContoursInTwoSegmentations({
    page,
    contourPanel,
    viewport: activeViewport,
  });

  await renderInactiveSegmentations.toggleDisplayInactiveSwitch();
  await expect(paths, 'Expected only the active contour to remain').toHaveCount(1);
  await expect(paths.first(), 'Expected the active contour unaffected').toHaveAttribute(
    'fill-opacity',
    defaultFillOpacity
  );

  await renderInactiveSegmentations.toggleDisplayInactiveSwitch();
  await expect(paths, 'Expected the inactive contour to be shown again').toHaveCount(2);
});
