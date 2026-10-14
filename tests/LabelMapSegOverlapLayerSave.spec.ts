import fs from 'node:fs';
import dcmjs from 'dcmjs';

import { expect, test, visitStudy } from './utils';

/**
 * Painting a segment across a locked segment puts the painted segment in a
 * separate labelmap layer, where it is stored under another label value. The
 * DICOM SEG save must still write each segment under its own segment number,
 * label and color.
 */
test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.256467663913010332776401703474716742458';
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should save each segment of an overlap layer under its own segment number', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const labelMapPanel = rightPanelPageObject.labelMapSegmentationPanel;
  await labelMapPanel.select();
  await labelMapPanel.addSegmentationButton.click();
  await expect(labelMapPanel.panel.rows).toHaveCount(1);

  const viewport = await viewportPageObject.getById('default');
  await labelMapPanel.tools.brush.click();
  await labelMapPanel.tools.brush.setRadius(10);

  // Segment 1: a horizontal stroke.
  await viewport.normalizedDragAt({ start: { x: 0.3, y: 0.5 }, end: { x: 0.7, y: 0.5 } });

  // Segment 2: a vertical stroke across segment 1, which is locked.
  await labelMapPanel.addSegmentButton.click();
  await expect(labelMapPanel.panel.rows).toHaveCount(2);
  await labelMapPanel.panel.nthSegment(0).actions.toggleLock();
  await viewport.normalizedDragAt({ start: { x: 0.5, y: 0.3 }, end: { x: 0.5, y: 0.7 } });

  // The test covers the remap only when segment 2 is in a separate layer.
  const layerCount = await page.evaluate(() => {
    const [segmentation] = (window as any).cornerstoneTools.segmentation.state.getSegmentations();
    return Object.keys(segmentation.representationData.Labelmap.labelmaps ?? {}).length;
  });
  expect(layerCount).toBeGreaterThan(1);

  // The save needs every source image of the series in the cache.
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const { cache, getEnabledElements } = (window as any).cornerstone;
          const imageIds = getEnabledElements()[0].viewport.getImageIds();
          return imageIds.every(imageId => cache.getImage(imageId));
        }),
      { timeout: 60_000 }
    )
    .toBe(true);

  await labelMapPanel.panel.moreMenu.click();
  await page.getByRole('menuitem', { name: 'Save' }).click();
  await page.getByRole('menuitem', { name: 'DICOM SEG' }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('report-download-button').click();
  const downloadPath = await (await downloadPromise).path();
  if (!downloadPath) {
    throw new Error('The save produced no downloaded file');
  }

  const bytes = fs.readFileSync(downloadPath);
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(
    dcmjs.data.DicomMessage.readFile(arrayBuffer).dict
  );

  const asArray = value => (Array.isArray(value) ? value : [value]);
  const segments = asArray(dataset.SegmentSequence);
  expect(segments.map(segment => segment.SegmentLabel)).toEqual(['Segment 1', 'Segment 2']);
  expect(segments[0].RecommendedDisplayCIELabValue).not.toEqual(
    segments[1].RecommendedDisplayCIELabValue
  );

  const framesPerSegment = {};
  for (const frame of asArray(dataset.PerFrameFunctionalGroupsSequence)) {
    const segmentNumber = asArray(frame.SegmentIdentificationSequence)[0].ReferencedSegmentNumber;
    framesPerSegment[segmentNumber] = (framesPerSegment[segmentNumber] ?? 0) + 1;
  }
  expect(framesPerSegment[1]).toBeGreaterThan(0);
  expect(framesPerSegment[2]).toBeGreaterThan(0);
});
