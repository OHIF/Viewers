import { test, expect } from 'playwright-test-coverage';
import { visitStudy, checkForScreenshot, screenShotPaths, simulateClicksOnElement } from './utils';
import { clickAllElements } from './utils/clickAllElements';
import { Locator, Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '2.16.124.113543.6004.101.103.20021117.190619.1';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

async function getButtons(page: Page) {
  return page
    .getByTestId('studyBrowser-panel')
    .getByRole('heading')
    .getByRole('button')
    .all();
}

async function getButtonNames(buttons: Locator[]) {
  const names: string[] = []
  for (const b of buttons) {
    const buttonName = await b.getAttribute('name');
    names.push(buttonName);
  }
  return names.sort();
}

test('should not change list of studies', async ({ page }) => {
  const studies = await getButtons(page);
  const studyNames = await getButtonNames(studies);
  const studyCount = studies.length;

  // Grab all of the case studies and expand the entries. If all goes well, we should have the
  // same list of studies after this operation!
  await clickAllElements(page, getButtons);

  const modifiedStudies = await getButtons(page)
  const modifiedStudyNames = await getButtonNames(modifiedStudies)
  const modifiedStudyCount = modifiedStudies.length;

  expect(modifiedStudyCount).toStrictEqual(studyCount);
  expect(modifiedStudyNames).toStrictEqual(studyNames);
});
