import {
  checkForViewportScreenshot,
  expect,
  screenShotPaths,
  test,
  visitStudy,
  waitForViewportRenderCycle,
} from './utils';

test.beforeEach(async ({ page, rightPanelPageObject }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.256467663913010332776401703474716742458';
  await visitStudy(page, studyInstanceUID, 'segmentation', 2000);

  await rightPanelPageObject.labelMapSegmentationPanel.select();
  await rightPanelPageObject.labelMapSegmentationPanel.addSegmentationButton.click();
});

test('expands the threshold range from typed values and uses it for painting', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const threshold = rightPanelPageObject.labelMapSegmentationPanel.tools.threshold;
  await threshold.click();
  await threshold.range.select();

  const { lowerInput, upperInput, lowerSlider, upperSlider } = threshold.range;

  await expect(lowerInput).toHaveValue('50');
  await expect(upperInput).toHaveValue('600');
  await expect(lowerSlider).toHaveAttribute('aria-valuemin', '0');
  await expect(upperSlider).toHaveAttribute('aria-valuemax', '1000');

  await lowerInput.fill('-1');
  await lowerInput.press('Enter');
  await lowerInput.press('End');
  await lowerInput.press('Backspace');
  await expect(lowerInput).toHaveValue('-');
  await lowerInput.press('Backspace');
  await expect(lowerInput).toHaveValue('');
  await lowerInput.pressSequentially('30');
  await lowerInput.press('Enter');
  await expect(lowerInput).toHaveValue('30');

  await lowerInput.fill('-1500');
  await lowerInput.press('Enter');
  await expect(lowerSlider).toHaveAttribute('aria-valuemin', '-1500');

  await upperInput.fill('');
  for (const [character, expectedValue] of [
    ['1', '1'],
    ['5', '15'],
    ['0', '150'],
    ['0', '1500'],
  ]) {
    await upperInput.press(character);
    await expect(upperInput).toHaveValue(expectedValue);
  }
  await upperInput.press('Enter');
  await expect(upperSlider).toHaveAttribute('aria-valuemax', '1500');

  await upperInput.fill('3000');
  await upperInput.press('Enter');
  await expect(upperSlider).toHaveAttribute('aria-valuemax', '3000');

  await page.keyboard.press('Escape');

  const activeViewport = await viewportPageObject.active;
  const renderCycle = waitForViewportRenderCycle(page);
  await activeViewport.normalizedDragAt({
    start: { x: 0.4, y: 0.5 },
    end: { x: 0.6, y: 0.5 },
  });
  await renderCycle;

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.thresholdRange.expandedRangePaint,
  });
});
