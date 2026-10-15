import { cache, eventTarget, metaData } from '@cornerstonejs/core';
import {
  Enums as cstEnums,
  segmentation as cstSegmentation,
  Types as cstTypes,
} from '@cornerstonejs/tools';

/**
 * The result of the voxel scan of each labelmap, kept until the segmentation
 * changes. The panel asks on each render, and a scan reads every voxel.
 */
const hasPixelDataByLabelmap = new WeakMap<cstTypes.LabelmapSegmentationData, boolean>();
let isListeningForChanges = false;

const listenForChanges = () => {
  if (isListeningForChanges) {
    return;
  }
  isListeningForChanges = true;
  const forget = (evt: CustomEvent<{ segmentationId: string }>) => {
    const labelmap = cstSegmentation.state.getSegmentation(evt.detail?.segmentationId)
      ?.representationData?.Labelmap;
    if (labelmap) {
      hasPixelDataByLabelmap.delete(labelmap);
    }
  };
  eventTarget.addEventListener(cstEnums.Events.SEGMENTATION_DATA_MODIFIED, forget as EventListener);
  eventTarget.addEventListener(cstEnums.Events.SEGMENTATION_MODIFIED, forget as EventListener);
};

/**
 * Scans the voxels of every layer of a labelmap.
 *
 * @returns true when a voxel is set, false when no voxel is set, and undefined
 *   when no voxel is set but an image is not in the cache yet. An undefined
 *   result must not be kept: no segmentation event follows when the image loads.
 */
const hasLabelmapPixelData = (labelmap: cstTypes.LabelmapSegmentationData): boolean | undefined => {
  // A segment can be in an overlap layer only, so check the images of every layer.
  // A single layer without image ids exports the top-level image ids, so scan those.
  const layers = Object.values(labelmap.labelmaps ?? {});
  const imageIds =
    layers.length > 1
      ? layers.flatMap(layer => layer.imageIds ?? [])
      : layers[0]?.imageIds?.length
        ? layers[0].imageIds
        : labelmap.imageIds;

  let isImageMissing = false;
  const hasPixelData = !!imageIds?.some(imageId => {
    const pixelData = cache.getImage(imageId)?.getPixelData();
    if (!pixelData) {
      isImageMissing = true;
      return false;
    }

    for (let i = 0; i < pixelData.length; i++) {
      if (pixelData[i] !== 0) {
        return true;
      }
    }
    return false;
  });

  return hasPixelData || (isImageMissing ? undefined : false);
};

/**
 * Checks if a labelmap segmentation has exportable data
 * A label map is exportable if it has any pixel data and
 * it is referenced by a display set that is reconstructable.
 *
 * @param labelmap - The labelmap representation data
 * @param displaySetService - The display set service instance
 * @returns boolean - Whether the labelmap has exportable data
 */
export const hasExportableLabelMapData = (
  labelmap: cstTypes.LabelmapSegmentationData | undefined,
  displaySetService: any
): boolean => {
  if (!labelmap) {
    return false;
  }

  listenForChanges();
  let hasPixelData = hasPixelDataByLabelmap.get(labelmap);
  if (hasPixelData === undefined) {
    hasPixelData = hasLabelmapPixelData(labelmap);
    if (hasPixelData !== undefined) {
      hasPixelDataByLabelmap.set(labelmap, hasPixelData);
    }
  }

  if (!hasPixelData) {
    return false;
  }

  const referencedImageIds = labelmap?.referencedImageIds;

  if (!referencedImageIds) {
    return false;
  }
  const firstImageId = referencedImageIds[0];
  const instance = metaData.get('instance', firstImageId);

  if (!instance) {
    return false;
  }

  const SOPInstanceUID = instance.SOPInstanceUID || instance.SopInstanceUID;
  const SeriesInstanceUID = instance.SeriesInstanceUID;
  const displaySet = displaySetService.getDisplaySetForSOPInstanceUID(
    SOPInstanceUID,
    SeriesInstanceUID
  );

  return !!displaySet;
};

/**
 * Checks if a contour segmentation has exportable data
 * A contour is exportable if it has any contour annotation/geometry data.
 *
 * @param contour - The contour representation data
 * @returns boolean - Whether the contour has exportable data
 */
export const hasExportableContourData = (
  contour: cstTypes.ContourSegmentationData | undefined
): boolean => {
  if (!contour) {
    return false;
  }

  const contourAnnotationUIDsMap = contour?.annotationUIDsMap;

  if (!contourAnnotationUIDsMap) {
    return false;
  }

  return contourAnnotationUIDsMap.size > 0;
};
