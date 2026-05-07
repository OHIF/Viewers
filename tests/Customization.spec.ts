import { expect, test, visitStudyOptions } from './utils';

test('should apply customization from URL query parameter', async ({ page }) => {
  const studyInstanceUID = '2.25.96975534054447904995905761963464388233';

  await visitStudyOptions(page, studyInstanceUID, {
    customization: 'veterinaryOverlay',
  });

  const patientNameOverlayItem = page
    .locator('[data-cy="viewport-overlay-top-left"] [title="Patient name"]')
    .first();

  await expect(patientNameOverlayItem).toBeVisible({ timeout: 60_000 });

  const patientNameOverlayText = (await patientNameOverlayItem.textContent())?.trim() ?? '';
  const patientNameValue = patientNameOverlayText.replace(/^Patient\s*/, '');

  expect(patientNameValue.length).toBeGreaterThan(0);
  expect(patientNameValue).not.toContain('[object Object]');
  expect(patientNameValue).toMatch(/horse/i);
});
