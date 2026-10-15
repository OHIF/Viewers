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
 * Gets the label values of one labelmap slice that the SEG export includes, in
 * one pass. The result is the `segmentsOnLabelmap` of a labelmap2D, which the
 * SEG adapter reads as label values.
 *
 * cs3D stores a segment in a private overlap layer under a label value that is
 * not its segment index (usually 1), and keeps the map in `labelToSegmentIndex`
 * of each layer. A label value that has no entry in that map belongs to no
 * segment: it is not returned, and it is added to `unboundLabels`. Without a
 * map, every label value is its own segment index.
 *
 * @param pixelData - The voxel values of the labelmap slice.
 * @param labelToSegmentIndex - The label map of the layer, or undefined.
 * @param unboundLabels - Gets each label value that has no entry in the map.
 */
export function getExportedLabelValues(
  pixelData,
  labelToSegmentIndex?: LabelToSegmentIndex,
  unboundLabels?: Set<number>
): number[] {
  const labelValues = new Set<number>();
  for (let i = 0; i < pixelData.length; i++) {
    const labelValue = pixelData[i];
    if (labelValue !== 0) {
      labelValues.add(labelValue);
    }
  }
  if (!labelToSegmentIndex) {
    return Array.from(labelValues);
  }
  return Array.from(labelValues).filter(labelValue => {
    if (labelToSegmentIndex[labelValue]) {
      return true;
    }
    unboundLabels?.add(labelValue);
    return false;
  });
}

/**
 * Gets the `labelToSegmentIndex` of a labelmap3D for the SEG adapter.
 *
 * The adapter reads a label value that is not in the map as its own segment
 * index. The export must not include a label value that has no segment, so the
 * map gives segment index 0 (no segment) to each such label value.
 */
export function getExportLabelToSegmentIndex(
  labelToSegmentIndex: LabelToSegmentIndex | undefined,
  unboundLabels: Set<number>
): LabelToSegmentIndex | undefined {
  if (!labelToSegmentIndex) {
    return undefined;
  }
  const exportMap = { ...labelToSegmentIndex };
  unboundLabels.forEach(labelValue => {
    exportMap[labelValue] = 0;
  });
  return exportMap;
}
