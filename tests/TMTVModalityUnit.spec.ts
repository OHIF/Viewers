import { expect, clearAllAnnotations, getTMTVModalityUnit, test, visitStudy } from './utils';

test.skip('pets where SUV cannot be calculated should show same unit in TMTV as in Basic Viewer.', async ({
  page,
  leftPanelPageObject,
  mainToolbarPageObject,
  viewportPageObject,
}) => {
  const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';
  const mode = 'tmtv';
  await visitStudy(page, studyInstanceUID, mode, 10000);

  // Show sidebar
  await leftPanelPageObject.toggle();

  // Change to image where SUV cannot be calculated
  await viewportPageObject.getNth(3).normalizedClickAt([{ x: 0.5, y: 0.5 }]);
  await page.getByRole('button', { name: 'NAC' }).nth(1).dblclick();

  // Wait for the new series to load
  await page.waitForLoadState('networkidle');

  // Add ROI annotation
  mainToolbarPageObject.measurementTools.ellipticalROI.click();
  await clearAllAnnotations(page);

  await viewportPageObject.active.clickAt([
    { x: 100, y: 100 },
    { x: 150, y: 150 },
  ]);

  const modalityUnit = await getTMTVModalityUnit(page);

  // in basic viewer, when you convert to volume, the unit is raw not PROPCNT (tmtv starts as a volume)
  expect(modalityUnit).toEqual('raw');
});
