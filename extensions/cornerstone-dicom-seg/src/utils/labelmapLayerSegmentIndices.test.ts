import { getLabelRemaps, toSegmentIndexPixels } from './labelmapLayerSegmentIndices';

// Segments 1 and 3 are in the primary layer. Segment 2 is in a private layer
// under label value 1.
const labelmapData = {
  segmentBindings: {
    1: { labelmapId: 'primary', labelValue: 1 },
    2: { labelmapId: 'private', labelValue: 1 },
    3: { labelmapId: 'primary', labelValue: 3 },
  },
};

describe('getLabelRemaps', () => {
  it('gives a remap only to a layer whose label values are not the segment indices', () => {
    const remaps = getLabelRemaps(labelmapData);

    expect([...remaps.keys()]).toEqual(['private']);
    expect(remaps.get('private').segmentIndexByLabel.get(1)).toBe(2);
  });
});

describe('toSegmentIndexPixels', () => {
  const privateRemap = getLabelRemaps(labelmapData).get('private');

  it('maps label values to segment indices, and keeps the cached pixels', () => {
    const pixelData = new Uint8Array([0, 1, 1, 0]);

    const slice = toSegmentIndexPixels(pixelData, privateRemap);

    expect(Array.from(slice.pixelData)).toEqual([0, 2, 2, 0]);
    expect(slice.segmentsOnLabelmap).toEqual([2]);
    expect(Array.from(pixelData)).toEqual([0, 1, 1, 0]);
  });

  it('keeps a label value that has no binding, as the cs3D renderer does', () => {
    const slice = toSegmentIndexPixels(new Uint8Array([1, 5]), privateRemap);

    expect(Array.from(slice.pixelData)).toEqual([2, 5]);
    expect(slice.segmentsOnLabelmap).toEqual([2, 5]);
  });

  it('does not copy a slice when no value changes', () => {
    const empty = new Uint8Array(4);
    const primary = new Uint8Array([0, 1, 3, 0]);

    expect(toSegmentIndexPixels(empty, privateRemap).pixelData).toBe(empty);
    expect(toSegmentIndexPixels(primary).pixelData).toBe(primary);
  });

  it('uses a Uint16Array when a segment index does not fit in a byte', () => {
    const remap = getLabelRemaps({
      segmentBindings: { 300: { labelmapId: 'private', labelValue: 1 } },
    }).get('private');

    const slice = toSegmentIndexPixels(new Uint8Array([0, 1]), remap);

    expect(slice.pixelData).toBeInstanceOf(Uint16Array);
    expect(Array.from(slice.pixelData)).toEqual([0, 300]);
  });
});
