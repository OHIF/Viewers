import {
  expect,
  clearAllAnnotations,
  getTMTVModalityUnit,
  simulateClicksOnElement,
  test,
  visitStudy,
} from './utils';

test.skip('pets where SUV cannot be calculated should show same unit in TMTV as in Basic Viewer.', async ({
  page,
  mainToolbarPageObject,
  viewportGridPageObject,
}) => {
  const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';
  const mode = 'tmtv';
  await visitStudy(page, studyInstanceUID, mode, 10000);

  // Show sidebar
  await page.getByTestId('side-panel-header-left').click();

  // Change to image where SUV cannot be calculated
  await viewportGridPageObject.getNthViewportPane(3).click();
  await page.getByRole('button', { name: 'NAC' }).nth(1).dblclick();

  // Wait for the new series to load
  await page.waitForLoadState('networkidle');

  // Add ROI annotation
  mainToolbarPageObject.measurementTools.ellipticalROI.click();
  const activeViewport = viewportGridPageObject.activeViewport;
  await clearAllAnnotations(page);

  await simulateClicksOnElement({
    locator: activeViewport,
    points: [
      { x: 100, y: 100 },
      { x: 150, y: 150 },
    ],
  });

  const modalityUnit = await getTMTVModalityUnit(page);

  // in basic viewer, when you convert to volume, the unit is raw not PROPCNT (tmtv starts as a volume)
  expect(modalityUnit).toEqual('raw');
});
