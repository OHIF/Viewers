import { cache, eventTarget, metaData } from '@cornerstonejs/core';
import { Enums as cstEnums, segmentation as cstSegmentation } from '@cornerstonejs/tools';
import { hasExportableLabelMapData } from './segmentationExportUtils';

jest.mock('@cornerstonejs/core', () => {
  const listeners = {};
  return {
    cache: { getImage: jest.fn() },
    metaData: { get: jest.fn() },
    eventTarget: {
      addEventListener: (type, listener) => {
        (listeners[type] ??= []).push(listener);
      },
      dispatchEvent: evt => (listeners[evt.type] ?? []).forEach(listener => listener(evt)),
    },
  };
});

jest.mock('@cornerstonejs/tools', () => ({
  Enums: {
    Events: {
      SEGMENTATION_DATA_MODIFIED: 'SEGMENTATION_DATA_MODIFIED',
      SEGMENTATION_MODIFIED: 'SEGMENTATION_MODIFIED',
    },
  },
  segmentation: { state: { getSegmentation: jest.fn() } },
}));

describe('hasExportableLabelMapData', () => {
  const displaySetService = { getDisplaySetForSOPInstanceUID: () => ({}) };
  const labelmap = { imageIds: ['labelmap:1'], referencedImageIds: ['source:1'] };

  beforeEach(() => {
    (metaData.get as jest.Mock).mockReturnValue({ SOPInstanceUID: '1', SeriesInstanceUID: '2' });
    (cstSegmentation.state.getSegmentation as jest.Mock).mockReturnValue({
      representationData: { Labelmap: labelmap },
    });
  });

  it('scans the voxels again only after the segmentation data changes', () => {
    const getImage = cache.getImage as jest.Mock;
    getImage.mockReturnValue({ getPixelData: () => new Uint8Array([0, 0]) });

    expect(hasExportableLabelMapData(labelmap, displaySetService)).toBe(false);
    expect(hasExportableLabelMapData(labelmap, displaySetService)).toBe(false);
    expect(getImage).toHaveBeenCalledTimes(1);

    getImage.mockReturnValue({ getPixelData: () => new Uint8Array([0, 1]) });
    eventTarget.dispatchEvent(
      Object.assign(new Event(cstEnums.Events.SEGMENTATION_DATA_MODIFIED), {
        detail: { segmentationId: 'seg' },
      })
    );

    expect(hasExportableLabelMapData(labelmap, displaySetService)).toBe(true);
    expect(getImage).toHaveBeenCalledTimes(2);
  });

  it('scans the voxels again while a labelmap image is not in the cache', () => {
    const loadingLabelmap = { imageIds: ['labelmap:2'], referencedImageIds: ['source:1'] };
    const getImage = cache.getImage as jest.Mock;
    getImage.mockReturnValue(undefined);

    expect(hasExportableLabelMapData(loadingLabelmap, displaySetService)).toBe(false);

    getImage.mockReturnValue({ getPixelData: () => new Uint8Array([0, 1]) });
    expect(hasExportableLabelMapData(loadingLabelmap, displaySetService)).toBe(true);
  });
});
