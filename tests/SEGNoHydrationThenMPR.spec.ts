import { screenShotPaths, test, visitStudyRendered } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.12.2.1107.5.2.32.35162.30000015050317233592200000046';
  await visitStudyRendered(page, studyInstanceUID);
});

test('should launch MPR with unhydrated SEG', async ({
  leftPanelPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await rightPanelPageObject.toggle();
  await leftPanelPageObject.loadSeriesByDescription('SEG');

  await viewportPageObject.checkForScreenshot(
    screenShotPaths.segNoHydrationThenMPR.segNoHydrationPreMPR
  );

  await mainToolbarPageObject.layoutSelection.MPR.click();

  await mainToolbarPageObject.waitForViewportsRendered();

  await viewportPageObject.checkForScreenshot(
    screenShotPaths.segNoHydrationThenMPR.segNoHydrationPostMPR
  );
});
