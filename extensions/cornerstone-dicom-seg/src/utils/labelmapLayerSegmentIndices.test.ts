import {
  getExportedLabelValues,
  getExportLabelToSegmentIndex,
  getSingleLayerExportSource,
} from './labelmapLayerSegmentIndices';

// Segment 2 is in a private layer under label value 1.
const privateLabelToSegmentIndex = { 1: 2 };

describe('getExportedLabelValues', () => {
  it('keeps every label value when the layer has no label map', () => {
    expect(getExportedLabelValues(new Uint8Array([0, 1, 3, 3]))).toEqual([1, 3]);
  });

  it('does not export a label value that has no segment, and reports it', () => {
    const unboundLabels = new Set<number>();

    const labelValues = getExportedLabelValues(
      new Uint8Array([1, 5, 5]),
      privateLabelToSegmentIndex,
      unboundLabels
    );

    expect(labelValues).toEqual([1]);
    expect(Array.from(unboundLabels)).toEqual([5]);
  });
});

describe('getExportLabelToSegmentIndex', () => {
  it('maps a label value that has no segment to 0, so the adapter does not export it', () => {
    expect(getExportLabelToSegmentIndex(privateLabelToSegmentIndex, new Set([5]))).toEqual({
      1: 2,
      5: 0,
    });
  });
});

describe('getSingleLayerExportSource', () => {
  it('applies the label map of the only layer when the layer has no image ids', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    const source = getSingleLayerExportSource({
      imageIds: ['labelmap:1'],
      labelmaps: {
        private: { labelmapId: 'private', volumeId: 'v', labelToSegmentIndex: { 1: 2 } },
      },
    });

    expect(source.imageIds).toEqual(['labelmap:1']);
    expect(source.labelToSegmentIndex).toEqual({ 1: 2 });
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});
