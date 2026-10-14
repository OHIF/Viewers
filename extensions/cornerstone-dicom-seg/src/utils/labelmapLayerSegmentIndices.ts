type SegmentBinding = { labelmapId: string; labelValue: number };

/**
 * A label remap of one labelmap layer: the map from a label value in the voxels
 * to the segment index, and the largest segment index in the map.
 */
export type LabelRemap = {
  segmentIndexByLabel: Map<number, number>;
  maxSegmentIndex: number;
};

/**
 * Gets the label remap of each labelmap layer whose label values are not the
 * segment indices.
 *
 * cs3D stores a segment in a private overlap layer under a label value that is
 * not its segment index (usually 1). The SEG adapter reads each voxel value as a
 * segment number, so the export must map the label values first.
 *
 * The remaps come from `segmentBindings`, which is the source that cs3D uses to
 * rebuild `labelToSegmentIndex` of each layer. A layer that has no remap keeps
 * its voxel values.
 *
 * @returns The label remap for each `labelmapId` that needs one.
 */
export function getLabelRemaps(labelmapData): Map<string, LabelRemap> {
  const segmentIndexByLabelByLayer = new Map<string, Map<number, number>>();
  const remappedLayerIds = new Set<string>();

  Object.entries((labelmapData?.segmentBindings ?? {}) as Record<string, SegmentBinding>).forEach(
    ([segmentIndexKey, { labelmapId, labelValue }]) => {
      const segmentIndex = Number(segmentIndexKey);
      let segmentIndexByLabel = segmentIndexByLabelByLayer.get(labelmapId);
      if (!segmentIndexByLabel) {
        segmentIndexByLabel = new Map();
        segmentIndexByLabelByLayer.set(labelmapId, segmentIndexByLabel);
      }
      segmentIndexByLabel.set(labelValue, segmentIndex);
      if (labelValue !== segmentIndex) {
        remappedLayerIds.add(labelmapId);
      }
    }
  );

  const remaps = new Map<string, LabelRemap>();
  remappedLayerIds.forEach(labelmapId => {
    const segmentIndexByLabel = segmentIndexByLabelByLayer.get(labelmapId);
    remaps.set(labelmapId, {
      segmentIndexByLabel,
      maxSegmentIndex: Math.max(...segmentIndexByLabel.values()),
    });
  });
  return remaps;
}

/**
 * Maps the label values of one labelmap slice to segment indices, and collects
 * the segments on the slice, in one pass.
 *
 * A label value that has no entry in the remap keeps its value. The cs3D
 * renderer and `getSegmentIndexForLabelValue` use the same fallback, so the SEG
 * holds the segments that the viewport shows.
 *
 * The cached labelmap image does not change. The function copies the slice only
 * when a voxel value changes, so an empty slice is never copied. The copy is a
 * `Uint16Array` when a segment index does not fit in the source array type.
 *
 * @param pixelData - The voxel values of the labelmap slice.
 * @param remap - The label remap of the layer, or undefined to keep the values.
 */
export function toSegmentIndexPixels(pixelData, remap?: LabelRemap) {
  const segmentsOnLabelmap = new Set<number>();
  let segmentIndexPixels = pixelData;

  for (let i = 0; i < pixelData.length; i++) {
    const labelValue = pixelData[i];
    if (labelValue === 0) {
      continue;
    }

    const segmentIndex = remap?.segmentIndexByLabel.get(labelValue) ?? labelValue;
    segmentsOnLabelmap.add(segmentIndex);
    if (segmentIndex !== labelValue) {
      if (segmentIndexPixels === pixelData) {
        const SegmentIndexArray =
          remap.maxSegmentIndex > 255 && pixelData.BYTES_PER_ELEMENT < 2
            ? Uint16Array
            : pixelData.constructor;
        segmentIndexPixels = new SegmentIndexArray(pixelData);
      }
      segmentIndexPixels[i] = segmentIndex;
    }
  }

  return {
    pixelData: segmentIndexPixels,
    segmentsOnLabelmap: Array.from(segmentsOnLabelmap),
  };
}
