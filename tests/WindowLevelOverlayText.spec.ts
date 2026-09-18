import { expect, test, visitStudy } from './utils';

test('should display the window level text as an overlay in various viewport layouts', async ({
  page,
  mainToolbarPageObject,
  viewportPageObject,
}) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095258.1';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);

  await expect((await viewportPageObject.getNth(0)).overlayText.bottomLeft.windowLevel).toBeVisible();

  await mainToolbarPageObject.layoutSelection.click();
  await page.getByTestId('Layout-3-0').click();

  for (let i = 0; i < 3; i++) {
    await expect((await viewportPageObject.getNth(i)).overlayText.bottomLeft.windowLevel).toBeVisible();
  }

  await mainToolbarPageObject.layoutSelection.click();
  await page.getByTestId('Layout-1-1').click();

  for (let i = 0; i < 3; i++) {
    await expect((await viewportPageObject.getNth(i)).overlayText.bottomLeft.windowLevel).toBeVisible();
  }
});

test('should display the window level text as an overlay in the various TMTV viewports', async ({
  page,
  viewportPageObject,
}) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.7009.2403.871108593056125491804754960339';
  const mode = 'tmtv';
  await visitStudy(page, studyInstanceUID, mode, 2000);

  for (let i = 0; i < 9; i++) {
    await expect((await viewportPageObject.getNth(i)).overlayText.bottomLeft.windowLevel).toBeVisible();
  }
});
