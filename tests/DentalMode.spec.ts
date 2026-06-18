import { addOHIFConfiguration, expect, test, visitStudy } from './utils';

const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';

test.beforeEach(async ({ page }) => {
  await addOHIFConfiguration(page, {
    modes: ['@ohif/mode-test', '@ohif/mode-dental'],
    dental: {
      practiceName: 'E2E Dental Practice',
      backendUrl: 'http://localhost:4007/api/dental',
      backendAuthToken: 'e2e-dental-token',
    },
  });

  await page.route('http://localhost:4007/api/dental/state/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        studyInstanceUID,
        state: null,
        updatedAt: null,
      }),
    });
  });
  await page.route('http://localhost:4007/api/dental/measurements/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        studyInstanceUID,
        measurements: [],
      }),
    });
  });

  await visitStudy(page, studyInstanceUID, 'dental', 2000, 'ohif');
});

test('opens Dental Mode and exposes its critical workflow surfaces', async ({ page }) => {
  await expect(page).toHaveURL(/\/dental\/ohif\?/);

  const practiceHeader = page.getByTestId('dental-practice-header');
  await expect(practiceHeader).toBeVisible();
  await expect(practiceHeader).toContainText('E2E Dental Practice');
  await expect(practiceHeader).toContainText('Dental Mode');

  const patientSummary = page.getByTestId('dental-patient-summary');
  await expect(patientSummary).toBeVisible();
  await expect(patientSummary).not.toContainText('No ID');
  await expect(patientSummary).not.toContainText('No modality');
  await expect(patientSummary).not.toContainText('No study date');

  await expect(page.getByTestId('dental-tooth-selector')).toBeVisible();
  await expect(page.getByTestId('dental-numbering-system-fdi')).toBeVisible();
  await expect(page.getByTestId('dental-numbering-system-universal')).toBeVisible();
  await expect(page.getByTestId('dental-selected-tooth')).toBeVisible();

  await expect(page.getByTestId('viewport-grid')).toBeVisible();
  await expect(page.locator('[data-viewportid="dental-current"]')).toBeAttached();
  await expect(page.getByTestId('dental-no-prior-placeholder')).toBeVisible();
  await expect(page.getByTestId('dental-bitewing-placeholder-left')).toBeVisible();
  await expect(page.getByTestId('dental-bitewing-placeholder-right')).toBeVisible();

  await page.getByTestId('dental-measurements-button').click();
  const palette = page.getByTestId('dental-measurements-palette');
  await expect(palette).toBeVisible();
  await expect(page.getByTestId('dental-measurement-preset-pa-length')).toBeVisible();
  await expect(page.getByTestId('dental-measurement-preset-canal-angle')).toBeVisible();
  await expect(page.getByTestId('dental-measurement-preset-crown-width')).toBeVisible();
  await expect(page.getByTestId('dental-measurement-preset-root-length')).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByTestId('side-panel-header-right').click();
  const measurementsPanel = page.getByTestId('dental-measurements-panel');
  await expect(measurementsPanel).toBeVisible();
  await expect(measurementsPanel).toContainText('Study Measurements');
  await expect(page.getByTestId('dental-measurements-empty')).toBeVisible();
  await expect(page.getByTestId('dental-export-json')).toBeVisible();
  await expect(page.getByTestId('dental-export-json')).toBeDisabled();
});
