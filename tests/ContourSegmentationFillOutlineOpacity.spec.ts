import { drawFreehandContour, expect, test, visitStudy, waitForViewportsRendered } from './utils';
import type { RightPanelPageObject } from './pages';
import type { IViewportPageObject } from './pages/ViewportPageObject';

const studyInstanceUID = '1.3.12.2.1107.5.2.32.35162.30000015050317233592200000046';
const mode = 'segmentation';

// Default contour style for segmentations created from the panel: the fill is enabled on
// creation (segmentationPanelCustomization) and inherits the Contour type-level fill alpha
// declared in the cornerstone extension init, while the outline uses the default width.
const defaultFillOpacity = '0.5';
const defaultOutlineWidth = '1';

// First entry of the cornerstone color LUT, which a panel-created segmentation gets for its
// first segment (SegmentationService seeds the LUT with the background color only).
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
 * Draws the first freehand contour of a test into the active segment and returns its SVG path,
 * asserting the viewport starts empty and ends up rendering the drawn contour.
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

  const contour = paths.nth(0);
  await expect(contour, 'Expected the drawn contour to be visible').toBeVisible();

  return contour;
}

test.beforeEach(async ({ page, rightPanelPageObject }) => {
  await visitStudy(page, studyInstanceUID, mode, 2000);
  await waitForViewportsRendered(page);

  const contourPanel = rightPanelPageObject.contourSegmentationPanel;
  await contourPanel.addSegmentation();
  await expect(contourPanel.panel.rows, 'Expected the default segment row').toHaveCount(1);
  await waitForViewportsRendered(page);

  // Expand the appearance config section holding the display tabs and sliders, so the tests
  // that only assert on its controls find them. The config actions expand it on their own.
  await contourPanel.config.open();
});

test('should render a panel-created contour with both fill and outline by default', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourPanel = rightPanelPageObject.contourSegmentationPanel;
  const { display } = contourPanel.config;
  const activeViewport = await viewportPageObject.active;
  const contour = await drawFirstContour({ contourPanel, viewport: activeViewport });

  await expect(
    display.fillAndOutline.button,
    'Expected the panel to start in fill & outline mode'
  ).toHaveAttribute('data-state', 'active');
  await expect(contour, 'Expected the fill at the default alpha').toHaveAttribute(
    'fill-opacity',
    defaultFillOpacity
  );
  await expect(contour, 'Expected the outline at the default width').toHaveAttribute(
    'stroke-width',
    defaultOutlineWidth
  );
  await expect(contour, 'Expected the fill to use the segment color').toHaveAttribute(
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
  const contour = await drawFirstContour({ contourPanel, viewport: activeViewport });

  await display.outline.click();
  await expect(display.outline.button, 'Expected the panel to be in outline mode').toHaveAttribute(
    'data-state',
    'active'
  );
  await expect(contour, 'Expected outline mode to hide the fill').toHaveAttribute(
    'fill-opacity',
    '0'
  );
  await expect(contour, 'Expected outline mode to keep the outline').toHaveAttribute(
    'stroke-width',
    defaultOutlineWidth
  );

  await display.fill.click();
  await expect(display.fill.button, 'Expected the panel to be in fill mode').toHaveAttribute(
    'data-state',
    'active'
  );
  await expect(contour, 'Expected fill mode to restore the fill').toHaveAttribute(
    'fill-opacity',
    defaultFillOpacity
  );
  await expect(contour, 'Expected fill mode to hide the outline').toHaveAttribute(
    'stroke-width',
    '0'
  );

  await display.fillAndOutline.click();
  await expect(
    display.fillAndOutline.button,
    'Expected the panel to be in fill & outline mode'
  ).toHaveAttribute('data-state', 'active');
  await expect(contour, 'Expected fill & outline mode to render the fill').toHaveAttribute(
    'fill-opacity',
    defaultFillOpacity
  );
  await expect(contour, 'Expected fill & outline mode to render the outline').toHaveAttribute(
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
  // The second contour must land in the second segment, so wait for the selection to render
  // before drawing it.
  await waitForViewportsRendered(page);

  // The freehand tool is still armed from the first contour.
  await drawFreehandContour({
    segmentationPanel: contourPanel,
    viewport: activeViewport,
    path: secondDragShape,
    activateTool: false,
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
  const contour = await drawFirstContour({ contourPanel, viewport: activeViewport });

  await expect(opacity.input, 'Expected the default opacity value').toHaveValue(defaultFillOpacity);

  await opacity.fill('0.3');
  await expect(opacity.input, 'Expected the opacity input to accept 0.3').toHaveValue('0.3');
  await expect(contour, 'Expected the fill to render at 0.3 alpha').toHaveAttribute(
    'fill-opacity',
    '0.3'
  );

  await opacity.fill('1');
  await expect(contour, 'Expected the fill to render fully opaque').toHaveAttribute(
    'fill-opacity',
    '1'
  );

  await opacity.fill('0');
  await expect(contour, 'Expected the fill to render fully transparent').toHaveAttribute(
    'fill-opacity',
    '0'
  );
  // A zero alpha is the opacity value hiding the fill, not the fill display being turned off.
  await expect(
    display.fillAndOutline.button,
    'Expected the panel to stay in fill & outline mode'
  ).toHaveAttribute('data-state', 'active');
  await expect(contour, 'Expected the outline to be unaffected by opacity').toHaveAttribute(
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
  const contour = await drawFirstContour({ contourPanel, viewport: activeViewport });

  await expect(border.input, 'Expected the default border value').toHaveValue(defaultOutlineWidth);

  await border.fill('5');
  await expect(border.input, 'Expected the border input to accept 5').toHaveValue('5');
  await expect(contour, 'Expected the outline to render 5px wide').toHaveAttribute(
    'stroke-width',
    '5'
  );
  await expect(contour, 'Expected the fill to be unaffected by border').toHaveAttribute(
    'fill-opacity',
    defaultFillOpacity
  );

  await border.fill('0');
  await expect(contour, 'Expected a zero border to hide the outline').toHaveAttribute(
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
  const contour = await drawFirstContour({ contourPanel, viewport: activeViewport });

  await display.outline.click();
  await expect(display.outline.button, 'Expected the panel to be in outline mode').toHaveAttribute(
    'data-state',
    'active'
  );
  await expect(contour, 'Expected outline mode to hide the fill').toHaveAttribute(
    'fill-opacity',
    '0'
  );

  // Changing the opacity while the fill is hidden must not reveal it.
  await opacity.fill('0.8');
  await expect(opacity.input, 'Expected the opacity input to accept 0.8').toHaveValue('0.8');
  await expect(contour, 'Expected the fill to stay hidden in outline mode').toHaveAttribute(
    'fill-opacity',
    '0'
  );
  await expect(contour, 'Expected the outline to keep rendering').toHaveAttribute(
    'stroke-width',
    defaultOutlineWidth
  );

  // Re-enabling the fill applies the opacity chosen while it was hidden.
  await display.fillAndOutline.click();
  await expect(contour, 'Expected the fill to return at the new alpha').toHaveAttribute(
    'fill-opacity',
    '0.8'
  );
});
