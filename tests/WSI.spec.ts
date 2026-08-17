import { test, visitStudy, checkForScreenshot, screenShotPaths } from './utils';

// A DICOM VL Whole Slide Microscopy (SM) study. Opened in `viewer` mode it is
// routed to the cornerstone3D WHOLE_SLIDE viewport (mode-basic registers
// `ohif.wsiSopClassHandler`), which is the render path that previously
// regressed to a gray canvas. This screenshot comparison is a
// simple safeguard: if the WSI viewport fails to mount and renders gray again,
// the baseline no longer matches and the test fails.
test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.2.276.0.7230010.3.1.2.296485376.1.1665793212.499772';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 5000);
});

test('should render the WSI viewport', async ({ page, viewportPageObject }) => {
  // WSI tiles load progressively; checkForScreenshot's built-in retry loop
  // gives the viewport time to paint before comparing against the baseline.
  await checkForScreenshot({
    page,
    locator: viewportPageObject.grid,
    screenshotPath: screenShotPaths.wsi.wsiDisplayedCorrectly,
  });
});
