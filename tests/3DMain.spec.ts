import {
  attemptAction,
  checkForScreenshot,
  reduce3DViewportSize,
  screenShotPaths,
  test,
  visitStudy,
} from './utils';
import { DEFAULT_3D_SERIES_UID } from './pages';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.1706.8374.643249677828306008300337414785';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test.describe('3D main Test', async () => {
  test('should render 3D main correctly grid compare.', async ({
    page,
    mainToolbarPageObject,
    viewportPageObject,
  }) => {
    await mainToolbarPageObject.layoutSelection.threeDMain.click();
    await attemptAction(() => reduce3DViewportSize(page), 10, 100);

    await mainToolbarPageObject.waitForLoad(DEFAULT_3D_SERIES_UID, {
      viewportType: 'volume3d',
    });

    await checkForScreenshot(
      page,
      viewportPageObject.grid,
      screenShotPaths.threeDMain.threeDMainDisplayedCorrectly
    );
  });
});
