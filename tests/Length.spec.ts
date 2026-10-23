import {
  checkForViewportScreenshot,
  expect,
  expectAnnotationStatsText,
  measurementTextFormatters,
  press,
  screenShotPaths,
  test,
  visitStudy,
  waitForViewportPainted,
} from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
  await waitForViewportPainted(page);
});

test('should display the length tool', async ({
  page,
  DOMOverlayPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await mainToolbarPageObject.measurementTools.length.click();
  const activeViewport = await viewportPageObject.active;
  await activeViewport.clickAt([
    { x: 364, y: 234 },
    { x: 544, y: 232 },
  ]);
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.length.lengthDisplayedCorrectly,
  });

  await rightPanelPageObject.measurementsPanel.select();

  const expectedValue = 278;

  await expectAnnotationStatsText({
    page,
    activeViewport,
    rightPanelPageObject,
    toolName: 'Length',
    expectedPanelPrimaryLines: [measurementTextFormatters.lengthLine(`${expectedValue}`)],
    expectedSvgLines: [measurementTextFormatters.lengthLine(`${expectedValue}`)],
    assertStats: stats => {
      expect(stats.unit).toBe('mm');
      expect(Math.round(stats.length as number)).toBe(expectedValue);
    },
  });
});

test('should ignore the undo and redo shortcuts when there is nothing to undo or redo', async ({
  page,
  DOMOverlayPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const { rows } = rightPanelPageObject.measurementsPanel.panel;
  const value = rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0).stats.primary.lines;
  await rightPanelPageObject.toggle();
  await rightPanelPageObject.measurementsPanel.select();

  // Nothing has been drawn yet, so both shortcuts are no-ops.
  await press({ page, key: 'Control+z' });
  await press({ page, key: 'Control+y' });
  await expect(rows).toHaveCount(0);

  await mainToolbarPageObject.measurementTools.length.click();
  const activeViewport = await viewportPageObject.active;
  await activeViewport.clickAt([
    { x: 364, y: 234 },
    { x: 544, y: 232 },
  ]);
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();
  await expect(rows).toHaveCount(1);
  const drawnValue = await value.first().innerText();

  await press({ page, key: 'Control+z' });
  await expect(rows).toHaveCount(0);

  // The undo stack is empty again, so this press must not consume the redo entry.
  await press({ page, key: 'Control+z' });
  await expect(rows).toHaveCount(0);

  await press({ page, key: 'Control+y' });
  await expect(rows).toHaveCount(1);
  await expect(value.first()).toHaveText(drawnValue);

  // The redo stack is empty now, so another press leaves the measurement as is.
  await press({ page, key: 'Control+y' });
  await expect(rows).toHaveCount(1);
  await expect(value.first()).toHaveText(drawnValue);
});
