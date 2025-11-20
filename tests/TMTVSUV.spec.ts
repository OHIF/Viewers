import { expect, test, visitStudy } from './utils';

test('should restrict the percentage of max SUV to be between 0 and 1', async ({
  page,
  viewportPageObject,
}) => {
  const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';
  const mode = 'tmtv';
  await visitStudy(page, studyInstanceUID, mode, 10000);

  await viewportPageObject.getById('ptAXIAL').normalizedClickAt([{ x: 0.5, y: 0.5 }]);

  await page.getByTestId('addSegmentation').click();
  await page.getByTestId('RectangleROIStartEndThreshold-btn').click();

  await page.getByTestId('percentage-of-max-suv-input').fill('0');
  expect(await page.getByTestId('percentage-of-max-suv-input').inputValue()).toBe('0');

  await page.getByTestId('percentage-of-max-suv-input').fill('0.27');
  expect(await page.getByTestId('percentage-of-max-suv-input').inputValue()).toBe('0.27');

  await page.getByTestId('percentage-of-max-suv-input').fill('0.9467');
  expect(await page.getByTestId('percentage-of-max-suv-input').inputValue()).toBe('0.9467');

  await page.getByTestId('percentage-of-max-suv-input').fill('.');
  expect(await page.getByTestId('percentage-of-max-suv-input').inputValue()).toBe('0.');

  await page.getByTestId('percentage-of-max-suv-input').fill('1');
  expect(await page.getByTestId('percentage-of-max-suv-input').inputValue()).toBe('1');

  await page.getByTestId('percentage-of-max-suv-input').fill('1.1');
  expect(await page.getByTestId('percentage-of-max-suv-input').inputValue()).toBe('1');

  await page.getByTestId('percentage-of-max-suv-input').fill('1806');
  expect(await page.getByTestId('percentage-of-max-suv-input').inputValue()).toBe('1');

  await page.getByTestId('percentage-of-max-suv-input').fill('');
  expect(await page.getByTestId('percentage-of-max-suv-input').inputValue()).toBe('');

  // Add some valid input for the tests that follow. Note that when invalid input is
  // entered the previous valid input is retained.
  await page.getByTestId('percentage-of-max-suv-input').fill('0.275');

  await page.getByTestId('percentage-of-max-suv-input').fill('9');
  expect(await page.getByTestId('percentage-of-max-suv-input').inputValue()).toBe('0.275');

  await page.getByTestId('percentage-of-max-suv-input').fill('-678');
  expect(await page.getByTestId('percentage-of-max-suv-input').inputValue()).toBe('0.275');

  await page.getByTestId('percentage-of-max-suv-input').fill('+');
  expect(await page.getByTestId('percentage-of-max-suv-input').inputValue()).toBe('0.275');

  await page.getByTestId('percentage-of-max-suv-input').fill('-');
  expect(await page.getByTestId('percentage-of-max-suv-input').inputValue()).toBe('0.275');

  await page.getByTestId('percentage-of-max-suv-input').fill('e');
  expect(await page.getByTestId('percentage-of-max-suv-input').inputValue()).toBe('0.275');
});
