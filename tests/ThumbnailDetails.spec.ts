import { expect, test, visitStudyOptions } from './utils';

// The only derived series in this study is a SEG, which is what the derived
// series detail line matters for.
const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.256467663913010332776401703474716742458';

test('shows the series number and the instance count by default', async ({
  page,
  leftPanelPageObject,
}) => {
  await visitStudyOptions(page, studyInstanceUID, { mode: 'segmentation', delay: 2000 });

  const thumbnail = leftPanelPageObject.derivedThumbnailAt(0);
  await expect(thumbnail.root).toBeVisible({ timeout: 120_000 });

  expect(await thumbnail.detailIds()).toEqual(['SeriesNumber', 'InstanceCount']);
  await expect(thumbnail.seriesNumber).toHaveText(/^S:\d+$/);
});

test('adds the creation date and time with the derivedDateTime customization', async ({
  page,
  leftPanelPageObject,
}) => {
  await visitStudyOptions(page, studyInstanceUID, {
    mode: 'segmentation',
    delay: 2000,
    customization: 'studyBrowser/derivedDateTime',
  });

  const thumbnail = leftPanelPageObject.derivedThumbnailAt(0);
  await expect(thumbnail.root).toBeVisible({ timeout: 120_000 });

  // Appended to the default items rather than replacing them.
  expect(await thumbnail.detailIds()).toEqual([
    'SeriesNumber',
    'InstanceCount',
    'InstanceDateTime',
  ]);

  // Formatted to the minute - the second a segmentation was saved says nothing
  // a reader can use, and is not reliably recorded either.
  await expect(thumbnail.instanceDateTime).toHaveText(/^\d{2}-\w{3}-\d{4} \d{2}:\d{2}$/);
});
