import { test, visitStudy, expect } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.5099.8010.217836670708542506360829799868';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should display the long series name properly within the series select button', async ({
  page,
  mainToolbarPageObject,
}) => {
  await mainToolbarPageObject.moreTools.tagBrowser.click();
  await page.waitForSelector('[role="dialog"]', { state: 'visible' });

  const seriesSelectButton = page.getByTestId('dicom-tag-series-select-trigger');
  const seriesSelectValue = page.getByTestId('dicom-tag-series-select-value');

  await expect(seriesSelectButton).toBeVisible();
  await expect(seriesSelectValue).toBeVisible();

  await seriesSelectButton.click();

  // Select the long series name (7th option - has a long description)
  const longSeriesOption = page.locator('[role="option"]').nth(6);
  await expect(longSeriesOption).toBeVisible();

  const fullOptionText = (await longSeriesOption.innerText()).split('\n')[0].trim();
  await longSeriesOption.click();

  await expect(seriesSelectValue).toContainText(fullOptionText);

  // Geometry check: ensure text doesn't overflow button
  const buttonBox = await seriesSelectButton.boundingBox();
  const textBox = await seriesSelectValue.boundingBox();

  expect(buttonBox).not.toBeNull();
  expect(textBox).not.toBeNull();

  expect(textBox.x, 'Text left edge should be within button').toBeGreaterThanOrEqual(buttonBox.x);
  expect(textBox.y, 'Text top edge should be within button').toBeGreaterThanOrEqual(buttonBox.y);
  expect(textBox.x + textBox.width, 'Text right edge should be within button').toBeLessThanOrEqual(
    buttonBox.x + buttonBox.width
  );
  expect(
    textBox.y + textBox.height,
    'Text bottom edge should be within button'
  ).toBeLessThanOrEqual(buttonBox.y + buttonBox.height);
});
