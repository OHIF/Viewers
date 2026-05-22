import {
  expect,
  test,
  visitStudy,
  waitForViewportRenderCycle,
  waitForViewportsRendered,
  getSvgAttribute,
} from './utils';

const NEW_HEX = '#FF00FF';
const NEW_HEX_CSS_RGB = 'rgb(255, 0, 255)';
const NEW_HEX_CSS_RGBA = 'rgba(255, 0, 255, 1)';

// Default colors baked into the RTSTRUCT in the canonical contour study.
const THRESHHOLD_CONTOUR_DEFAULT_HEX = '#00EBEB';
const THRESHHOLD_CONTOUR_DEFAULT_CSS_RGBA = 'rgba(0, 235, 235, 1)';
const THRESHHOLD_CONTOUR_DEFAULT_CSS_RGB = 'rgb(0, 235, 235)';

const STUDY_UID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';

test.beforeEach(async ({ page, leftPanelPageObject, DOMOverlayPageObject }) => {
  await visitStudy(page, STUDY_UID, 'segmentation', 2000);

  await leftPanelPageObject.loadSeriesByModality('RTSTRUCT');
  await waitForViewportsRendered(page);

  const hydrationCycle = waitForViewportRenderCycle(page);
  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();
  await hydrationCycle;
});

test('opens the color edit popup when "Change Color" is clicked', async ({
  rightPanelPageObject,
  DOMOverlayPageObject,
}) => {
  await rightPanelPageObject.contourSegmentationPanel.segmentsVisibilityToggle.click();
  const segment = rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(0);
  await segment.toggleVisibility();

  await segment.actions.openChangeColor();

  await expect(DOMOverlayPageObject.dialog.colorPicker.locator).toBeVisible();
  await expect(DOMOverlayPageObject.dialog.title).toContainText('Segment Color');
  await expect(DOMOverlayPageObject.dialog.colorPicker.saveButton).toBeVisible();
  await expect(DOMOverlayPageObject.dialog.colorPicker.cancelButton).toBeVisible();

  await expect(DOMOverlayPageObject.dialog.colorPicker.hexInput).toHaveValue(
    THRESHHOLD_CONTOUR_DEFAULT_HEX
  );
});

test('changes the contour color when the user saves', async ({
  viewportPageObject,
  rightPanelPageObject,
  DOMOverlayPageObject,
}) => {
  await rightPanelPageObject.contourSegmentationPanel.segmentsVisibilityToggle.click();
  const segment = rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(0);
  await segment.toggleVisibility();
  await segment.click();

  await expect(segment.colorSwatch).toHaveCSS('background-color',THRESHHOLD_CONTOUR_DEFAULT_CSS_RGB);

  const svgStrokeAttributeBeforeColorChange = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'stroke',
  });

  expect(svgStrokeAttributeBeforeColorChange, 'Expected SVG stroke attribute to be original threshold color').toBe(
    THRESHHOLD_CONTOUR_DEFAULT_CSS_RGBA
  );

  // change color
  await segment.actions.changeColor(NEW_HEX);

  await expect(DOMOverlayPageObject.dialog.colorPicker.locator).toBeHidden();
  await expect(segment.colorSwatch).toHaveCSS('background-color', NEW_HEX_CSS_RGB);

  //check svg path stroke attribute is updated with new color
  const svgStrokeAttributeAfterColorChange = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'stroke',
  });

  expect(svgStrokeAttributeAfterColorChange, 'Expected SVG stroke attribute to be updated with new color').toBe(
    NEW_HEX_CSS_RGBA
  );
});

test('does not change the contour color when the user cancels', async ({
  rightPanelPageObject,
  DOMOverlayPageObject,
  viewportPageObject
}) => {
  await rightPanelPageObject.contourSegmentationPanel.segmentsVisibilityToggle.click();
  const segment = rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(0);
  await segment.toggleVisibility();
  await segment.click();

  await expect(segment.colorSwatch).toHaveCSS(
    'background-color',
    THRESHHOLD_CONTOUR_DEFAULT_CSS_RGB
  );

  const svgStrokeAttributeBeforeColorChange = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'stroke',
  });

  expect(svgStrokeAttributeBeforeColorChange, 'Expected SVG stroke attribute to be original threshold color').toBe(
    THRESHHOLD_CONTOUR_DEFAULT_CSS_RGBA
  );

  await segment.actions.cancelChangeColor(NEW_HEX);

  await expect(DOMOverlayPageObject.dialog.colorPicker.locator).toBeHidden();
  await expect(segment.colorSwatch).toHaveCSS('background-color', THRESHHOLD_CONTOUR_DEFAULT_CSS_RGB);

  //check svg path stroke attribute is updated with new color
  const svgStrokeAttributeAfterColorChange = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'stroke',
  });

  expect(svgStrokeAttributeAfterColorChange, 'Expected SVG stroke attribute to remain the original color').toBe(
    THRESHHOLD_CONTOUR_DEFAULT_CSS_RGBA
  );
});

test('duplicated contour will be generated with a new color', async ({
  viewportPageObject,
  rightPanelPageObject,
}) => {
  await rightPanelPageObject.contourSegmentationPanel.segmentsVisibilityToggle.click();
  const panel = rightPanelPageObject.contourSegmentationPanel.panel;
  const segment0 = panel.nthSegment(0);
  await segment0.toggleVisibility();
  await segment0.click();

   await expect(segment0.colorSwatch).toHaveCSS(
    'background-color',
    THRESHHOLD_CONTOUR_DEFAULT_CSS_RGB
  );

  const svgStrokeAttributeBeforeColorChange = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'stroke',
  });

  expect(svgStrokeAttributeBeforeColorChange, 'Expected SVG stroke attribute to be original threshold color').toBe(
    THRESHHOLD_CONTOUR_DEFAULT_CSS_RGBA
  );

  // duplicate the segment
  await segment0.actions.duplicate();
  await segment0.toggleVisibility(); // toggle original segment 0 visibility off to be able to grab the duplicated segment's path

  const duplicateSegment = panel.nthSegment(4);
  await duplicateSegment.click();

  const duplicatedSegmentSvgStrokeAttribute = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'stroke',
  });

  await expect(duplicateSegment.colorSwatch).not.toHaveCSS(
    'background-color',
    THRESHHOLD_CONTOUR_DEFAULT_CSS_RGB
  );

  expect(duplicatedSegmentSvgStrokeAttribute, 'Expected duplicated segment to have a different stroke color').not.toBe(
    THRESHHOLD_CONTOUR_DEFAULT_CSS_RGBA
  );
});
