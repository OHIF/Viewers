import { expect, test } from '@playwright/test';
import { visitStudy, simulateClicksOnElement, getSUV, clearAllAnnotations } from './utils/index';

test.skip('should update SUV values correctly.', async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.7009.2403.871108593056125491804754960339';
  const mode = 'Total Metabolic Tumor Volume';
  await visitStudy(page, studyInstanceUID, mode, 10000);

  // Create ROI
  await page.getByTestId('petSUV-btn').click();
  await page.getByTestId('MeasurementTools-split-button-secondary').click();
  await page.getByTestId('EllipticalROI').click();
  const locator = page.getByTestId('viewport-pane').locator('canvas').first();
  await clearAllAnnotations(page);

  await simulateClicksOnElement({
    locator,
    points: [
      {
        x: 100,
        y: 100,
      },
      {
        x: 150,
        y: 150,
      },
    ],
  });

  // Get current SUV text
  let oldSUV = await getSUV(page);

  // Change PT Weight
  await page.getByTestId('input-weight-input').fill('31');
  await page.getByText('Reload Data').click();
  await page.waitForLoadState('networkidle');
  // Get new SUV text
  let newSUV = await getSUV(page);

  // Compare then store new SUV
  expect.soft(newSUV).not.toEqual(oldSUV);
  oldSUV = newSUV;

  // Change total dose
  await page
    .getByText('Patient SexWeight kgTotal')
    .locator('div')
    .filter({ hasText: /^Total Dose bq$/ })
    .getByTestId('input-undefined')
    .fill('1888020304');
  await page.getByText('Reload Data').click();
  await page.waitForLoadState('networkidle');

  // Get new SUV
  newSUV = await getSUV(page);

  // Compare then store new
  expect.soft(newSUV).not.toEqual(oldSUV);
  oldSUV = newSUV;

  // Change injection time
  await page
    .getByText('Patient SexWeight kgTotal')
    .locator('div')
    .filter({ hasText: /^Injection Time s$/ })
    .getByTestId('input-undefined')
    .fill('060000');
  await page.getByText('Reload Data').click();
  await page.waitForLoadState('networkidle');

  // Get new SUV
  newSUV = await getSUV(page);

  // Compare SUV
  expect.soft(newSUV).not.toEqual(oldSUV);
});
