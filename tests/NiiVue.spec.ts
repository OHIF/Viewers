import { test, expect, visitStudy, checkForScreenshot, screenShotPaths } from './utils';

// The NiiVue mode renders image series in NiiVue viewports (@niivue/nv-ohif),
// converting the DICOM with dcm2niix in the browser. The Cornerstone render
// helpers (waitForViewportsRendered, getViewportCanvasStats) do not apply and
// the NiiVue WebGL canvas cannot be read back, so the spec waits for nv-ohif's
// own progress text to clear and then compares viewport-grid screenshots.
//
// The static e2e test data cannot be used here: it has frames only, no whole
// instances for dcm2niix, so this spec loads from the default `ohif` source.
const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.1706.8374.643249677828306008300337414785';

// nv-ohif shows "Fetching DICOM series... n/N" and then "Converting DICOM to
// NIfTI (dcm2niix)..." in the viewport while it loads, and an "isn't something
// NiiVue can load" message for series it does not support.
const loadingOrUnsupported = /Fetching DICOM series|Converting DICOM|can load yet/;

test.beforeEach(async ({ page, viewportPageObject }) => {
  await visitStudy(page, studyInstanceUID, 'niivue', 2000);
  await expect(viewportPageObject.grid).not.toContainText(loadingOrUnsupported, {
    timeout: 120_000,
  });
});

test('should render the series in the NiiVue multiplanar view', async ({
  page,
  viewportPageObject,
}) => {
  await checkForScreenshot({
    page,
    locator: viewportPageObject.grid,
    screenshotPath: screenShotPaths.niivue.multiplanarDisplayedCorrectly,
  });
});

test('should switch the NiiVue viewport to the axial view', async ({
  page,
  mainToolbarPageObject,
  viewportPageObject,
}) => {
  await mainToolbarPageObject.niivueViews.axial.click();

  await checkForScreenshot({
    page,
    locator: viewportPageObject.grid,
    screenshotPath: screenShotPaths.niivue.axialDisplayedCorrectly,
  });
});
