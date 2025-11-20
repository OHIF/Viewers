import { expect, clearAllAnnotations, getSUV, test, visitStudy } from './utils';

test.skip('should update SUV values correctly.', async ({
  page,
  mainToolbarPageObject,
  viewportPageObject,
}) => {
  const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';
  const mode = 'tmtv';
  await visitStudy(page, studyInstanceUID, mode, 10000);

  // Create ROI
  await page.getByTestId('petSUV-btn').click();
  await mainToolbarPageObject.measurementTools.ellipticalROI.click();
  await clearAllAnnotations(page);

  await viewportPageObject.active.clickAt([
    { x: 100, y: 100 },
    { x: 150, y: 150 },
  ]);

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
