import {
  test,
  visitStudy,
  waitForViewportRenderCycle,
  checkForScreenshot,
  screenShotPaths,
} from './utils';

const segments = {
  bigSphere: 'Big Sphere',
  smallSphere: 'Small Sphere',
  result: 'Segment 5',
} as const;

test.beforeEach(
  async ({ page, leftPanelPageObject, DOMOverlayPageObject, rightPanelPageObject }) => {
    const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';
    await visitStudy(page, studyInstanceUID, 'segmentation', 2000);
    await leftPanelPageObject.loadSeriesByModality('RTSTRUCT');

    const viewportRenderCycle = waitForViewportRenderCycle(page);
    await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();
    await viewportRenderCycle;
    await rightPanelPageObject.contourSegmentationPanel.select();
  }
);

test.describe('Intersect operation', () => {
  test('intersect Big Sphere with Small Sphere (nested, no edge crossing) produces Small Sphere', async ({
    page,
    rightPanelPageObject,
    viewportPageObject,
  }) => {
    const contourSegmentationPanel = rightPanelPageObject.contourSegmentationPanel;

    const activeViewport = await viewportPageObject.active;
    await activeViewport.pane.dblclick();

    await contourSegmentationPanel.config.toggle.click();

    await contourSegmentationPanel.config.display.fillAndOutline();

    await contourSegmentationPanel.panel.segmentByText(segments.bigSphere).click();

    const combineContours = rightPanelPageObject.contourSegmentationPanel.combineContours;

    await combineContours.open();
    await combineContours.selectOperation('intersect');
    await combineContours.selectSegmentA(segments.bigSphere);
    await combineContours.selectSegmentB(segments.smallSphere);
    await combineContours.enableCreateNewSegment();
    let viewportRenderCycle = waitForViewportRenderCycle(page);
    await combineContours.apply();
    await viewportRenderCycle;

    await contourSegmentationPanel.segmentsVisibilityToggle.click();

    viewportRenderCycle = waitForViewportRenderCycle(page);
    await contourSegmentationPanel.panel.segmentByText(segments.result).toggleVisibility();
    await viewportRenderCycle;

    await checkForScreenshot(
      page,
      viewportPageObject.grid,
      screenShotPaths.contourCombineOperations.intersectBigSphereSmallSphereResult
    );
  });
});

test.describe('Subtract operation', () => {
  test('subtract Big Sphere minus Small Sphere (nested, no edge crossing) produces Big Sphere with a hole', async ({
    page,
    rightPanelPageObject,
    viewportPageObject,
  }) => {
    const contourSegmentationPanel = rightPanelPageObject.contourSegmentationPanel;

    const activeViewport = await viewportPageObject.active;
    await activeViewport.pane.dblclick();

    await contourSegmentationPanel.config.toggle.click();

    await contourSegmentationPanel.config.display.fillAndOutline();

    await contourSegmentationPanel.panel.segmentByText(segments.bigSphere).click();

    const combineContours = rightPanelPageObject.contourSegmentationPanel.combineContours;

    await combineContours.open();
    await combineContours.selectOperation('subtract');
    await combineContours.selectSegmentA(segments.bigSphere);
    await combineContours.selectSegmentB(segments.smallSphere);
    await combineContours.enableCreateNewSegment();
    let viewportRenderCycle = waitForViewportRenderCycle(page);
    await combineContours.apply();
    await viewportRenderCycle;

    await contourSegmentationPanel.segmentsVisibilityToggle.click();

    viewportRenderCycle = waitForViewportRenderCycle(page);
    await contourSegmentationPanel.panel.segmentByText(segments.result).toggleVisibility();
    await viewportRenderCycle;

    await checkForScreenshot(
      page,
      viewportPageObject.grid,
      screenShotPaths.contourCombineOperations.subtractBigSphereMinusSmallSphereResult
    );
  });
});
