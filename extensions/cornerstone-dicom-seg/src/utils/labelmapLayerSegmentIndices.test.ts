import { getSingleLayerExportSource, toSegmentIndexPixels } from './labelmapLayerSegmentIndices';

// Segment 2 is in a private layer under label value 1.
const privateLabelToSegmentIndex = { 1: 2 };

describe('toSegmentIndexPixels', () => {
  it('maps label values to segment indices, and keeps the cached pixels', () => {
    const pixelData = new Uint8Array([0, 1, 1, 0]);

    const slice = toSegmentIndexPixels(pixelData, privateLabelToSegmentIndex);

    expect(Array.from(slice.pixelData)).toEqual([0, 2, 2, 0]);
    expect(slice.segmentsOnLabelmap).toEqual([2]);
    expect(Array.from(pixelData)).toEqual([0, 1, 1, 0]);
  });

  it('keeps the values when the layer has no label map', () => {
    const slice = toSegmentIndexPixels(new Uint8Array([0, 1, 3]));

    expect(Array.from(slice.pixelData)).toEqual([0, 1, 3]);
    expect(slice.segmentsOnLabelmap).toEqual([1, 3]);
  });

  it('does not export a label value that has no segment, and reports it once', () => {
    const onUnboundLabel = jest.fn();

    const slice = toSegmentIndexPixels(
      new Uint8Array([1, 5, 5]),
      privateLabelToSegmentIndex,
      onUnboundLabel
    );

    expect(Array.from(slice.pixelData)).toEqual([2, 0, 0]);
    expect(slice.segmentsOnLabelmap).toEqual([2]);
    expect(onUnboundLabel.mock.calls).toEqual([[5]]);
  });

  it('writes segment indices up to 255 from an Int8Array without overflow', () => {
    const slice = toSegmentIndexPixels(new Int8Array([0, 1]), { 1: 200 });

    expect(Array.from(slice.pixelData)).toEqual([0, 200]);
  });

  it('writes a segment index above 255', () => {
    const slice = toSegmentIndexPixels(new Uint8Array([0, 1]), { 1: 300 });

    expect(Array.from(slice.pixelData)).toEqual([0, 300]);
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
