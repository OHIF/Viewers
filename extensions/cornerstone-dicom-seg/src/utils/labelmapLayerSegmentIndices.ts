/** The map from a label value in the voxels of a labelmap layer to the segment index. */
export type LabelToSegmentIndex = { [labelValue: number]: number };

type LabelmapLayer = {
  labelmapId?: string;
  imageIds?: string[];
  labelToSegmentIndex?: LabelToSegmentIndex;
};

/**
 * Gets the image ids and the label map that the export of a single-layer
 * segmentation uses.
 *
 * The only layer can be a private overlap layer, so its label map applies also
 * when the layer has no image ids of its own and the legacy `imageIds` are used.
 */
export function getSingleLayerExportSource(labelmapData): {
  imageIds: string[];
  labelToSegmentIndex?: LabelToSegmentIndex;
} {
  const layer: LabelmapLayer | undefined = Object.values(labelmapData.labelmaps ?? {})[0];
  if (layer && !layer.imageIds) {
    console.warn(
      `Labelmap layer ${layer.labelmapId} has no image ids. The SEG export uses the segmentation image ids with the label map of that layer.`
    );
  }
  return {
    imageIds: layer?.imageIds ?? labelmapData.imageIds,
    labelToSegmentIndex: layer?.labelToSegmentIndex,
  };
}

/**
 * Maps the label values of one labelmap slice to segment indices, and collects
 * the segments on the slice, in one pass.
 *
 * cs3D stores a segment in a private overlap layer under a label value that is
 * not its segment index (usually 1). Each layer keeps the map in
 * `labelToSegmentIndex`. The SEG adapter reads each voxel value as a segment
 * number, so the export must map the label values first.
 *
 * A label value that has no entry in the map belongs to no segment, so the SEG
 * has no segment metadata for it. Such voxels are written as 0 (not exported),
 * and `onUnboundLabel` is called for each such label value. Without a map, the
 * label values are kept.
 *
 * The cached labelmap image does not change. The function copies the slice only
 * when a voxel value changes. The copy is a `Uint8Array` when all segment
 * indices are 255 or less, else a `Uint16Array`.
 *
 * cornerstonejs/cornerstone3D#2988 lets the SEG adapter take
 * `labelmap3D.labelToSegmentIndex`. After OHIF moves to that release, the export
 * can set that map on each labelmap3D, and this function can be removed.
 *
 * @param pixelData - The voxel values of the labelmap slice.
 * @param labelToSegmentIndex - The label map of the layer, or undefined to keep the values.
 * @param onUnboundLabel - Called with each label value that has no entry in the map.
 */
export function toSegmentIndexPixels(
  pixelData,
  labelToSegmentIndex?: LabelToSegmentIndex,
  onUnboundLabel?: (labelValue: number) => void
) {
  const segmentsOnLabelmap = new Set<number>();
  const unboundLabels = new Set<number>();
  let segmentIndexPixels = pixelData;

  for (let i = 0; i < pixelData.length; i++) {
    const labelValue = pixelData[i];
    if (labelValue === 0) {
      continue;
    }

    let segmentIndex = labelValue;
    if (labelToSegmentIndex) {
      segmentIndex = labelToSegmentIndex[labelValue] ?? 0;
      if (segmentIndex === 0) {
        unboundLabels.add(labelValue);
      }
    }
    if (segmentIndex !== 0) {
      segmentsOnLabelmap.add(segmentIndex);
    }
    if (segmentIndex !== labelValue) {
      if (segmentIndexPixels === pixelData) {
        const maxSegmentIndex = Math.max(0, ...Object.values(labelToSegmentIndex));
        const SegmentIndexArray = maxSegmentIndex > 255 ? Uint16Array : Uint8Array;
        segmentIndexPixels = new SegmentIndexArray(pixelData);
      }
      segmentIndexPixels[i] = segmentIndex;
    }
  }

  unboundLabels.forEach(labelValue => onUnboundLabel?.(labelValue));

  return {
    pixelData: segmentIndexPixels,
    segmentsOnLabelmap: Array.from(segmentsOnLabelmap),
  };
}
