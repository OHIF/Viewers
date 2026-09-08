import { expect, test, visitStudy, waitForViewportsRendered } from './utils';

const studyInstanceUID = '1.3.12.2.1107.5.2.32.35162.30000015050317233592200000046';
const mode = 'segmentation';

// Default contour style for segmentations created from the panel: the fill is
// enabled on creation and inherits the type-level fill alpha, the outline uses
// the default outline width (see segmentationPanelCustomization / contourConfig).
const defaultFillOpacity = '0.5';
const defaultOutlineWidth = '1';

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

test.beforeEach(async ({ page, rightPanelPageObject }) => {
  await visitStudy(page, studyInstanceUID, mode, 2000);
  await waitForViewportsRendered(page);

  const contourPanel = rightPanelPageObject.contourSegmentationPanel;
  await contourPanel.addSegmentation();
  await expect(contourPanel.panel.rows, 'Expected the default segment row').toHaveCount(1);
  await waitForViewportsRendered(page);

  // Expand the appearance config section holding the display tabs and sliders.
  await contourPanel.config.toggle.click();
});

test('should render a panel-created contour with both fill and outline by default', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourPanel = rightPanelPageObject.contourSegmentationPanel;
  const activeViewport = await viewportPageObject.active;
  const paths = activeViewport.svg('path');

  await expect(paths, 'Expected the starting number of paths to be 0').toHaveCount(0);
  await contourPanel.tools.freehandContour.click();
  await activeViewport.normalizedPathDragAt({ path: dragShape });
  await expect(paths, 'Expected the freehand contour to be added').toHaveCount(1);

  const contour = paths.nth(0);
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
    /^rgb\(/
  );
});

test('should toggle fill and outline rendering when switching display modes', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourPanel = rightPanelPageObject.contourSegmentationPanel;
  const activeViewport = await viewportPageObject.active;
  const paths = activeViewport.svg('path');

  await expect(paths, 'Expected the starting number of paths to be 0').toHaveCount(0);
  await contourPanel.tools.freehandContour.click();
  await activeViewport.normalizedPathDragAt({ path: dragShape });
  await expect(paths, 'Expected the freehand contour to be added').toHaveCount(1);
  const contour = paths.nth(0);

  await contourPanel.config.display.outline();
  await expect(contour, 'Expected outline mode to hide the fill').toHaveAttribute(
    'fill-opacity',
    '0'
  );
  await expect(contour, 'Expected outline mode to keep the outline').toHaveAttribute(
    'stroke-width',
    defaultOutlineWidth
  );

  await contourPanel.config.display.fill();
  await expect(contour, 'Expected fill mode to restore the fill').toHaveAttribute(
    'fill-opacity',
    defaultFillOpacity
  );
  await expect(contour, 'Expected fill mode to hide the outline').toHaveAttribute(
    'stroke-width',
    '0'
  );

  await contourPanel.config.display.fillAndOutline();
  await expect(contour, 'Expected fill & outline mode to render the fill').toHaveAttribute(
    'fill-opacity',
    defaultFillOpacity
  );
  await expect(contour, 'Expected fill & outline mode to render the outline').toHaveAttribute(
    'stroke-width',
    defaultOutlineWidth
  );
});

test('should apply the selected display mode to contours drawn afterwards in any segment', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourPanel = rightPanelPageObject.contourSegmentationPanel;
  const panel = contourPanel.panel;
  const activeViewport = await viewportPageObject.active;
  const paths = activeViewport.svg('path');

  await expect(paths, 'Expected the starting number of paths to be 0').toHaveCount(0);

  // Select outline-only before anything is drawn.
  await contourPanel.config.display.outline();

  await contourPanel.tools.freehandContour.click();
  await activeViewport.normalizedPathDragAt({ path: dragShape });
  await expect(paths, 'Expected the first freehand contour to be added').toHaveCount(1);

  await contourPanel.addSegmentButton.click();
  await expect(panel.rows, 'Expected a second segment row to be added').toHaveCount(2);
  await panel.nthSegment(1).click();
  await waitForViewportsRendered(page);

  await activeViewport.normalizedPathDragAt({ path: secondDragShape });
  await expect(paths, 'Expected the second freehand contour to be added').toHaveCount(2);

  await expect(paths.nth(0), 'Expected the first contour without fill').toHaveAttribute(
    'fill-opacity',
    '0'
  );
  await expect(paths.nth(1), 'Expected the second contour without fill').toHaveAttribute(
    'fill-opacity',
    '0'
  );

  // Switching back must re-render both existing contours with a fill.
  await contourPanel.config.display.fillAndOutline();
  await expect(paths.nth(0), 'Expected the first contour to regain its fill').toHaveAttribute(
    'fill-opacity',
    defaultFillOpacity
  );
  await expect(paths.nth(1), 'Expected the second contour to regain its fill').toHaveAttribute(
    'fill-opacity',
    defaultFillOpacity
  );
});

test('should change the contour fill opacity when the opacity slider value changes', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourPanel = rightPanelPageObject.contourSegmentationPanel;
  const { opacity } = contourPanel.config;
  const activeViewport = await viewportPageObject.active;
  const paths = activeViewport.svg('path');

  await expect(paths, 'Expected the starting number of paths to be 0').toHaveCount(0);
  await contourPanel.tools.freehandContour.click();
  await activeViewport.normalizedPathDragAt({ path: dragShape });
  await expect(paths, 'Expected the freehand contour to be added').toHaveCount(1);
  const contour = paths.nth(0);

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
  await expect(contour, 'Expected the outline to be unaffected by opacity').toHaveAttribute(
    'stroke-width',
    defaultOutlineWidth
  );
});

test('should change the contour outline width when the border slider value changes', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const contourPanel = rightPanelPageObject.contourSegmentationPanel;
  const { border } = contourPanel.config;
  const activeViewport = await viewportPageObject.active;
  const paths = activeViewport.svg('path');

  await expect(paths, 'Expected the starting number of paths to be 0').toHaveCount(0);
  await contourPanel.tools.freehandContour.click();
  await activeViewport.normalizedPathDragAt({ path: dragShape });
  await expect(paths, 'Expected the freehand contour to be added').toHaveCount(1);
  const contour = paths.nth(0);

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
  const { opacity } = contourPanel.config;
  const activeViewport = await viewportPageObject.active;
  const paths = activeViewport.svg('path');

  await expect(paths, 'Expected the starting number of paths to be 0').toHaveCount(0);
  await contourPanel.tools.freehandContour.click();
  await activeViewport.normalizedPathDragAt({ path: dragShape });
  await expect(paths, 'Expected the freehand contour to be added').toHaveCount(1);
  const contour = paths.nth(0);

  await contourPanel.config.display.outline();
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
  await contourPanel.config.display.fillAndOutline();
  await expect(contour, 'Expected the fill to return at the new alpha').toHaveAttribute(
    'fill-opacity',
    '0.8'
  );
});
