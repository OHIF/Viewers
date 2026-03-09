import {
  checkForScreenshot,
  initializeMousePositionTracker,
  screenShotPaths,
  test,
  visitStudy,
} from './utils/index.js';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.1706.8374.643249677828306008300337414785';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
  await initializeMousePositionTracker(page);
});

test.describe('Crosshairs Test', async () => {
  test('should render the crosshairs correctly.', async ({ page, mainToolbarPageObject }) => {
    await mainToolbarPageObject.layoutSelection.MPR.click();
    await mainToolbarPageObject.crosshairs.click();

    await checkForScreenshot(page, page, screenShotPaths.crosshairs.crosshairsRendered);
  });

  test('should allow the user to rotate the crosshairs', async ({
    page,
    mainToolbarPageObject,
    viewportPageObject,
  }) => {
    await mainToolbarPageObject.layoutSelection.MPR.click();
    await mainToolbarPageObject.crosshairs.click();

    await viewportPageObject.crosshairs.axial.rotate();
    await viewportPageObject.crosshairs.sagittal.rotate();
    await viewportPageObject.crosshairs.coronal.rotate();

    await checkForScreenshot(page, page, screenShotPaths.crosshairs.crosshairsRotated);
  });

  test('should allow the user to adjust the slab thickness', async ({
    page,
    mainToolbarPageObject,
    viewportPageObject,
  }) => {
    await mainToolbarPageObject.layoutSelection.MPR.click();
    await mainToolbarPageObject.crosshairs.click();

    await viewportPageObject.crosshairs.axial.increase();
    await viewportPageObject.crosshairs.sagittal.increase();
    await viewportPageObject.crosshairs.coronal.increase();

    await checkForScreenshot(page, page, screenShotPaths.crosshairs.crosshairsSlabThickness);
  });

  test('should reset the crosshairs to the initial position when reset is clicked', async ({
    page,
    mainToolbarPageObject,
    viewportPageObject,
  }) => {
    await mainToolbarPageObject.layoutSelection.MPR.click();
    await mainToolbarPageObject.crosshairs.click();

    await viewportPageObject.crosshairs.axial.rotate();
    await viewportPageObject.crosshairs.sagittal.rotate();
    await viewportPageObject.crosshairs.coronal.rotate();

    await mainToolbarPageObject.moreTools.reset.click();

    await checkForScreenshot(page, page, screenShotPaths.crosshairs.crosshairsResetToolbar);
  });

  test('should reset the crosshairs when a new displayset is loaded', async ({
    page,
    mainToolbarPageObject,
    leftPanelPageObject,
    viewportPageObject,
  }) => {
    await mainToolbarPageObject.layoutSelection.MPR.click();
    await mainToolbarPageObject.crosshairs.click();

    await viewportPageObject.crosshairs.axial.rotate();
    await viewportPageObject.crosshairs.sagittal.rotate();
    await viewportPageObject.crosshairs.coronal.rotate();

    await leftPanelPageObject.loadSeriesByDescription('Recon 3: LIVER 3 PHASE (AP)');

    await checkForScreenshot(page, page, screenShotPaths.crosshairs.crosshairsNewDisplayset);
  });
});
