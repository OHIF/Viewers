import { test, expect } from '@playwright/test';
import {
  visitStudy,
  simulateClicksOnElement,
  getTMTVModalityUnit,
  clearAllAnnotations,
} from './utils/index';

test.skip('pets where SUV cannot be calculated should show same unit in TMTV as in Basic Viewer.', async ({
  page,
}) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.7009.2403.871108593056125491804754960339';
  const mode = 'Total Metabolic Tumor Volume';
  await visitStudy(page, studyInstanceUID, mode, 10000);

  // Change to image where SUV cannot be calculated
  await page.getByTestId('side-panel-header-left').click();
  await page
    .getByRole('button', { name: 'S: 2 311 PET NAC' })
    .dragTo(page.getByTestId('viewport-grid').locator('canvas').nth(3));

  // Wait for the new series to load
  await page.waitForLoadState('networkidle');

  // Add ROI annotation
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

  const modalityUnit = await getTMTVModalityUnit(page);

  // in basic viewer, when you convert to volume, the unit is raw not PROPCNT (tmtv starts as a volume)
  expect(modalityUnit).toEqual('raw');
});
