import { expect, test, visitStudy } from './utils';

test('should restrict the percentage of max SUV to be between 0 and 1', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';
  const mode = 'tmtv';
  await visitStudy(page, studyInstanceUID, mode, 10000);

  await viewportPageObject.getById('ptAXIAL').normalizedClickAt([{ x: 0.5, y: 0.5 }]);

  await rightPanelPageObject.tmtvPanel.addSegmentationButton.click();

  const rectangleROIThreshold = rightPanelPageObject.tmtvPanel.tools.rectangleROIThreshold;
  await rectangleROIThreshold.click();

  await rectangleROIThreshold.setPercentageOfMaxSUV('0');
  expect(await rectangleROIThreshold.getPercentageOfMaxSUV()).toBe('0');

  await rectangleROIThreshold.setPercentageOfMaxSUV('0.27');
  expect(await rectangleROIThreshold.getPercentageOfMaxSUV()).toBe('0.27');

  await rectangleROIThreshold.setPercentageOfMaxSUV('0.9467');
  expect(await rectangleROIThreshold.getPercentageOfMaxSUV()).toBe('0.9467');

  await rectangleROIThreshold.setPercentageOfMaxSUV('.');
  expect(await rectangleROIThreshold.getPercentageOfMaxSUV()).toBe('0.');

  await rectangleROIThreshold.setPercentageOfMaxSUV('1');
  expect(await rectangleROIThreshold.getPercentageOfMaxSUV()).toBe('1');

  await rectangleROIThreshold.setPercentageOfMaxSUV('1.1');
  expect(await rectangleROIThreshold.getPercentageOfMaxSUV()).toBe('1');

  await rectangleROIThreshold.setPercentageOfMaxSUV('1806');
  expect(await rectangleROIThreshold.getPercentageOfMaxSUV()).toBe('1');

  await rectangleROIThreshold.setPercentageOfMaxSUV('');
  expect(await rectangleROIThreshold.getPercentageOfMaxSUV()).toBe('');

  // Add some valid input for the tests that follow. Note that when invalid input is
  // entered the previous valid input is retained.
  await rectangleROIThreshold.setPercentageOfMaxSUV('0.275');

  await rectangleROIThreshold.setPercentageOfMaxSUV('9');
  expect(await rectangleROIThreshold.getPercentageOfMaxSUV()).toBe('0.275');

  await rectangleROIThreshold.setPercentageOfMaxSUV('-678');
  expect(await rectangleROIThreshold.getPercentageOfMaxSUV()).toBe('0.275');

  await rectangleROIThreshold.setPercentageOfMaxSUV('+');
  expect(await rectangleROIThreshold.getPercentageOfMaxSUV()).toBe('0.275');

  await rectangleROIThreshold.setPercentageOfMaxSUV('-');
  expect(await rectangleROIThreshold.getPercentageOfMaxSUV()).toBe('0.275');

  await rectangleROIThreshold.setPercentageOfMaxSUV('e');
  expect(await rectangleROIThreshold.getPercentageOfMaxSUV()).toBe('0.275');
});
