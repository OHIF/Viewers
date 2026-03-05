import { checkForScreenshot, expect, screenShotPaths, test, visitStudy } from './utils';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    let _config;
    Object.defineProperty(window, 'config', {
      get() {
        return _config;
      },
      set(value) {
        _config = {
          ...value,
          disableConfirmationPrompts: true,
        };
      },
      configurable: true,
    });
  });

  const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should auto hydrate RT STRUCT on the second load and keep viewport stable after deleting segmentations', async ({
  page,
  DOMOverlayPageObject,
  leftPanelPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  // First load
  await leftPanelPageObject.loadSeriesByModality('RTSTRUCT');
  await page.waitForTimeout(5000);

  const loadBadgeCountAfterFirstLoad =
    await DOMOverlayPageObject.viewport.getModalityLoadBadgeCount();
  expect(loadBadgeCountAfterFirstLoad).toBe(0);

  await checkForScreenshot(
    page,
    viewportPageObject.active.pane,
    screenShotPaths.rtHydrationDisableConfirmation.firstLoadPostHydration
  );

  await rightPanelPageObject.toggle();

  await rightPanelPageObject.noToolsSegmentationPanel.panel.deleteAll();
  await page.waitForTimeout(2000);

  await checkForScreenshot(
    page,
    viewportPageObject.active.pane,
    screenShotPaths.rtHydrationDisableConfirmation.viewportAfterFirstDelete
  );

  // Second load
  await leftPanelPageObject.loadSeriesByModality('RTSTRUCT');

  await page.waitForTimeout(5000);

  const loadBadgeCountAfterSecondLoad =
    await DOMOverlayPageObject.viewport.getModalityLoadBadgeCount();
  expect(loadBadgeCountAfterSecondLoad).toBe(0);

  await checkForScreenshot(
    page,
    viewportPageObject.active.pane,
    screenShotPaths.rtHydrationDisableConfirmation.secondLoadPostHydration
  );

  await rightPanelPageObject.noToolsSegmentationPanel.panel.deleteAll();

  await page.waitForTimeout(2000);

  await checkForScreenshot(
    page,
    viewportPageObject.active.pane,
    screenShotPaths.rtHydrationDisableConfirmation.viewportAfterSecondDelete
  );
});
