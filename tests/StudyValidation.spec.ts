import { expect, test } from './utils';

test.describe('Study Validation', () => {
  const invalidStudyUID = '9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9';
  const validStudyUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';

  const modes = ['viewer', 'segmentation', 'microscopy', 'tmtv'];

  // Test 1: Single invalid study
  modes.forEach(mode => {
    test(`should display error page when study UID is not found in ${mode} mode`, async ({
      page,
      notFoundStudyPageObject,
    }) => {
      await page.goto(`/${mode}/ohif?StudyInstanceUIDs=${invalidStudyUID}`);

      await page.waitForURL('**/notfoundstudy', { timeout: 15000 });

      await expect(notFoundStudyPageObject.errorMessage).toBeVisible();
      await expect(notFoundStudyPageObject.errorMessage).toHaveText(
        'One or more of the requested studies are not available at this time.'
      );

      await expect(notFoundStudyPageObject.returnMessage).toBeVisible();
      await expect(notFoundStudyPageObject.returnMessage).toContainText(
        'Return to the study list to select a different study to view.'
      );

      await expect(notFoundStudyPageObject.studyListLink).toBeVisible();
      await expect(notFoundStudyPageObject.studyListLink).toHaveAttribute('href', '/');
    });
  });

  // Test 2: Multiple studies - valid first, then invalid
  modes.forEach(mode => {
    test(`should display error page when second study UID is invalid in ${mode} mode`, async ({
      page,
      notFoundStudyPageObject,
    }) => {
      await page.goto(`/${mode}/ohif?StudyInstanceUIDs=${validStudyUID},${invalidStudyUID}`);

      await page.waitForURL('**/notfoundstudy', { timeout: 15000 });

      await expect(notFoundStudyPageObject.errorMessage).toBeVisible();
      await expect(notFoundStudyPageObject.errorMessage).toHaveText(
        'One or more of the requested studies are not available at this time.'
      );

      await expect(notFoundStudyPageObject.returnMessage).toBeVisible();
      await expect(notFoundStudyPageObject.returnMessage).toContainText(
        'Return to the study list to select a different study to view.'
      );

      await expect(notFoundStudyPageObject.studyListLink).toBeVisible();
      await expect(notFoundStudyPageObject.studyListLink).toHaveAttribute('href', '/');
    });
  });

  // Test 3: Multiple studies - invalid first, then valid
  modes.forEach(mode => {
    test(`should display error page when first study UID is invalid in ${mode} mode`, async ({
      page,
      notFoundStudyPageObject,
    }) => {
      await page.goto(`/${mode}/ohif?StudyInstanceUIDs=${invalidStudyUID},${validStudyUID}`);

      await page.waitForURL('**/notfoundstudy', { timeout: 15000 });

      await expect(notFoundStudyPageObject.errorMessage).toBeVisible();
      await expect(notFoundStudyPageObject.errorMessage).toHaveText(
        'One or more of the requested studies are not available at this time.'
      );

      await expect(notFoundStudyPageObject.returnMessage).toBeVisible();
      await expect(notFoundStudyPageObject.returnMessage).toContainText(
        'Return to the study list to select a different study to view.'
      );

      await expect(notFoundStudyPageObject.studyListLink).toBeVisible();
      await expect(notFoundStudyPageObject.studyListLink).toHaveAttribute('href', '/');
    });
  });
});
