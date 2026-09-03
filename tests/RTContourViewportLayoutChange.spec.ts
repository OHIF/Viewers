import { expect, test, visitStudy, getSvgAttribute, waitForViewportRenderCycle } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.12201.1091.126683095609223531686845324113579088978';
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});
test('should keep RT contours correctly positioned after maximizing and restoring the viewport', async ({
  page,
  viewportPageObject,
  leftPanelPageObject,
  DOMOverlayPageObject,
}) => {
  await leftPanelPageObject.loadSeriesByModality('RTSTRUCT');

  let viewportRenderCycle = waitForViewportRenderCycle(page);
  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();
  await viewportRenderCycle;

  const initialSvgPath = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });

  expect(initialSvgPath).not.toBeNull();
  const activeViewport = await viewportPageObject.active;

  viewportRenderCycle = waitForViewportRenderCycle(page);
  // First double-click: maximize viewport to one-up layout
  await activeViewport.pane.dblclick();
  await viewportRenderCycle;

  viewportRenderCycle = waitForViewportRenderCycle(page);
  // Second double-click: restore to the original multi-viewport layout
  await activeViewport.pane.dblclick();
  await viewportRenderCycle;

  const restoredSvgPath = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  expect(restoredSvgPath).not.toBeNull();
  expect(restoredSvgPath).toBe(initialSvgPath);
});
