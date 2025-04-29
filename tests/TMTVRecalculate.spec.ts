import { expect, test } from 'playwright-test-coverage';
import { visitStudy, simulateClicksOnElement, getSUV, clearAllAnnotations } from './utils/index';

test.skip('should update SUV values correctly.', async ({ page }) => {
  const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';
  const mode = 'tmtv';
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
  await page.locator('#weight-input').fill('31');
  await page.getByText('Reload Data').click();
  await page.waitForLoadState('networkidle');
  // Get new SUV text
  let newSUV = await getSUV(page);

  // Compare then store new SUV
  expect.soft(newSUV).not.toEqual(oldSUV);
  oldSUV = newSUV;

  // Change total dose
  await page
    .locator('div')
    .filter({ hasText: /^Total Dose bq$/ })
    .getByRole('textbox')
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
    .locator('div')
    .filter({ hasText: /^Injection Time s$/ })
    .getByRole('textbox')
    .fill('060000');
  await page.getByText('Reload Data').click();
  await page.waitForLoadState('networkidle');

  // Get new SUV
  newSUV = await getSUV(page);

  // Compare SUV
  expect.soft(newSUV).not.toEqual(oldSUV);
});
