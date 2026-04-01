import { expect, test, visitStudy } from './utils';

test('checks that segmentations created from series with no series description are labelled as "No description  S:{series number} {modality}"', async ({
  rightPanelPageObject,
  leftPanelPageObject,
  DOMOverlayPageObject,
  page,
}) => {
  const studyInstanceUID = '1.3.6.1.4.1.32722.99.99.62087908186665265759322018723889952421';
  await visitStudy(page, studyInstanceUID, { mode: 'segmentation' }); // segmentation mode for add/remove

  const segmentationPanel = rightPanelPageObject.contourSegmentationPanel.menuButton;

  // Switch to contour tab.
  await segmentationPanel.click();

  await leftPanelPageObject.loadSeriesByModality('RTSTRUCT');
  await page.waitForTimeout(5000);
  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();

  expect(rightPanelPageObject.contourSegmentationPanel.segmentationSelect.selectedValue).toHaveText(
    'No description  S:4 RTSTRUCT'
  );

  expect(
    await rightPanelPageObject.contourSegmentationPanel.segmentationSelect.nthSegmentation(0)
  ).toHaveText('No description  S:4 RTSTRUCT');
});
