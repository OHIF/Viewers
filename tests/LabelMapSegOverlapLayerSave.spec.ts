import fs from 'node:fs';
// dcmjs is not a root dependency: it resolves to the hoisted copy that the
// workspace packages pin.
import dcmjs from 'dcmjs';
import type { Page } from '@playwright/test';

import { expect, test, visitStudy } from './utils';

/**
 * A segment in a separate labelmap layer is stored under another label value
 * (usually 1). The DICOM SEG save must still write each segment under its own
 * segment number, label and color.
 *
 * The test puts segment 2 in a separate layer with
 * `segmentation.helpers.moveSegmentToPrivateLabelmap`
 * (cornerstonejs/cornerstone3D#2988). The cornerstone3D release that OHIF uses
 * now does not export that function, and its tools configuration (with
 * `segmentation.overwriteMode`) is not available to the page. With that release
 * the test paints segment 2 across a locked segment 1, which moves segment 2 to
 * a separate layer. Remove that fallback after OHIF moves to a release with #2988.
 */
test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.256467663913010332776401703474716742458';
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

const asArray = value => (Array.isArray(value) ? value : [value]);

const hasMoveSegmentApi = (page: Page) =>
  page.evaluate(
    () => !!(window as any).cornerstoneTools.segmentation.helpers?.moveSegmentToPrivateLabelmap
  );

/** Moves a segment to a separate labelmap layer with the cornerstone3D API. */
const moveSegmentToNewLayer = (page: Page, segmentIndex: number) =>
  page.evaluate(segmentIndex => {
    const { segmentation } = (window as any).cornerstoneTools;
    const [{ segmentationId }] = segmentation.state.getSegmentations();
    segmentation.helpers.moveSegmentToPrivateLabelmap(segmentationId, segmentIndex);
  }, segmentIndex);

const getLayerCount = (page: Page) =>
  page.evaluate(() => {
    const [segmentation] = (window as any).cornerstoneTools.segmentation.state.getSegmentations();
    return Object.keys(segmentation.representationData.Labelmap.labelmaps ?? {}).length;
  });

/** Saves the segmentation as DICOM SEG with the Download button, and reads the file. */
const saveAndReadSeg = async (page: Page, labelMapPanel) => {
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
  return dcmjs.data.DicomMetaDictionary.naturalizeDataset(
    dcmjs.data.DicomMessage.readFile(arrayBuffer).dict
  );
};

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

  // Segment 2: a vertical stroke across segment 1, in a separate layer.
  await labelMapPanel.addSegmentButton.click();
  await expect(labelMapPanel.panel.rows).toHaveCount(2);
  const canMoveSegment = await hasMoveSegmentApi(page);
  const isSegment1Locked = !canMoveSegment;
  if (isSegment1Locked) {
    // Fallback for a cornerstone3D release without #2988 (see the comment at the top).
    await labelMapPanel.panel.nthSegment(0).actions.toggleLock();
  }
  await viewport.normalizedDragAt({ start: { x: 0.5, y: 0.3 }, end: { x: 0.5, y: 0.7 } });
  if (canMoveSegment) {
    await moveSegmentToNewLayer(page, 2);
  }
  expect(await getLayerCount(page)).toBeGreaterThan(1);

  // The save needs every source image of the series in the cache.
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const { cache, getEnabledElementByViewportId } = (window as any).cornerstone;
          const imageIds = getEnabledElementByViewportId('default').viewport.getImageIds();
          return imageIds.every(imageId => cache.getImage(imageId));
        }),
      { timeout: 60_000 }
    )
    .toBe(true);

  const dataset = await saveAndReadSeg(page, labelMapPanel);
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

  // Delete segment 1. The private layer of segment 2 is then the only layer.
  if (isSegment1Locked) {
    await labelMapPanel.panel.nthSegment(0).actions.toggleLock();
  }
  await labelMapPanel.panel.nthSegment(0).actions.delete();
  await expect(labelMapPanel.panel.rows).toHaveCount(1);
  expect(await getLayerCount(page)).toBe(1);

  const onlySegment2 = await saveAndReadSeg(page, labelMapPanel);
  const onlySegments = asArray(onlySegment2.SegmentSequence);
  expect(onlySegments.map(segment => segment.SegmentLabel)).toEqual(['Segment 2']);
  expect(onlySegments[0].RecommendedDisplayCIELabValue).toEqual(
    segments[1].RecommendedDisplayCIELabValue
  );
  expect(Number(onlySegment2.NumberOfFrames)).toBeGreaterThan(0);
});
