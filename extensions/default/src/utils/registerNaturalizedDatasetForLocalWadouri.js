import dicomImageLoader from '@cornerstonejs/dicom-image-loader';
import OHIF from '@ohif/core';

import {
  datasetToDicomBlob,
  makeExistingPropertiesNonEnumerable,
  setNonEnumerableInstanceProperty,
} from './dicomWriter';
import { appendFrameQueryToImageId } from './appendFrameQueryToImageId';

const metadataProvider = OHIF.classes.MetadataProvider;

const SEG_REGISTER_LOG_PREFIX = '[SEG register]';

// Every registration pins a full Part 10 Blob in the fileManager (and, once
// loaded, a parsed copy in the dataSetCacheManager) with no other owner, so
// track the imageIds and release them on mode exit.
const registeredImageIds = new Set();

/**
 * Releases everything previously registered via
 * {@link registerNaturalizedDatasetForLocalWadouri}: the Part 10 Blob held by the
 * wadouri fileManager and any parsed dataset the dataSetCacheManager retained.
 * Call on mode exit.
 */
export function releaseLocalWadouriRegistrations() {
  const { fileManager, dataSetCacheManager } = dicomImageLoader.wadouri;

  for (const imageId of registeredImageIds) {
    // 'dicomfile:<index>' — the index doubles as the fileManager slot and the
    // dataSetCacheManager uri (the scheme is stripped for cache keys).
    const uri = imageId.substring(imageId.indexOf(':') + 1);
    const fileIndex = Number(uri);

    if (Number.isInteger(fileIndex) && fileIndex >= 0) {
      fileManager.remove(fileIndex);
    }

    // unload() decrements a refcount shared with cornerstone's image decache;
    // nothing may outlive mode exit, so drive it to zero.
    for (let guard = 0; guard < 100000 && dataSetCacheManager.isLoaded(uri); guard++) {
      dataSetCacheManager.unload(uri);
    }
  }

  registeredImageIds.clear();
}

/**
 * Registers a naturalized DICOM dataset with the wadouri file manager so it can be
 * loaded like other locally stored instances (blob URL), instead of remote wadors URLs.
 *
 * Datasets without pixel data (SR, RTSTRUCT, ...) are skipped: they have no frames
 * to serve through the image loader, so registering them would only pin their
 * Part 10 Blob in memory for the rest of the session.
 *
 * @param {object} dataset - Naturalized DICOM instance (e.g. generated SEG).
 * @param {object} [options]
 * @param {string[]} [options.referencedImageIds] - Used for logging / frame count hints.
 * @returns {string|undefined} wadouri imageId assigned to dataset.url, or undefined when skipped
 */
export function registerNaturalizedDatasetForLocalWadouri(dataset, options = {}) {
  const { referencedImageIds = [] } = options;

  if (
    dataset.PixelData === undefined &&
    !Array.isArray(dataset.PerFrameFunctionalGroupsSequence)
  ) {
    OHIF.log.debug(
      SEG_REGISTER_LOG_PREFIX,
      'Skipping local wadouri registration (no pixel data)',
      { SOPClassUID: dataset.SOPClassUID, SOPInstanceUID: dataset.SOPInstanceUID }
    );
    return undefined;
  }

  const blob = datasetToDicomBlob(dataset);
  const imageId = dicomImageLoader.wadouri.fileManager.add(blob);
  registeredImageIds.add(imageId);

  setNonEnumerableInstanceProperty(dataset, 'url', imageId);

  const { StudyInstanceUID, SeriesInstanceUID } = dataset;
  const SOPInstanceUID = dataset.SOPInstanceUID || dataset.SopInstanceUID;

  const perFrameGroups = dataset.PerFrameFunctionalGroupsSequence;
  if (Array.isArray(perFrameGroups) && !dataset.NumberOfFrames) {
    dataset.NumberOfFrames = perFrameGroups.length;
  }

  // Local only — never written back to the dataset: single-frame IODs (SR,
  // RTSTRUCT) must not gain a NumberOfFrames element in their serialized form.
  const numberOfFrames = Math.max(
    Number(dataset.NumberOfFrames) || 0,
    Array.isArray(perFrameGroups) ? perFrameGroups.length : 0,
    1
  );

  const frameImageIds = [];
  if (StudyInstanceUID && SeriesInstanceUID && SOPInstanceUID) {
    const registerMapping = (id, frameNumber = 1) => {
      metadataProvider.addImageIdToUIDs(id, {
        StudyInstanceUID,
        SeriesInstanceUID,
        SOPInstanceUID,
        frameNumber,
      });
    };

    for (let frame = 1; frame <= numberOfFrames; frame++) {
      const frameImageId =
        numberOfFrames > 1 ? appendFrameQueryToImageId(imageId, frame) : imageId;

      frameImageIds.push(frameImageId);
      registerMapping(frameImageId, frame);
    }
  }

  makeExistingPropertiesNonEnumerable(dataset);

  OHIF.log.debug(SEG_REGISTER_LOG_PREFIX, 'Registered local wadouri instance', {
    StudyInstanceUID,
    SeriesInstanceUID,
    SOPInstanceUID,
    numberOfFrames,
    baseImageId: imageId,
    frameImageIds,
    blobSizeBytes: blob.size,
    referencedImageIdCount: referencedImageIds.length,
    SegmentationType: dataset.SegmentationType,
    SOPClassUID: dataset.SOPClassUID,
  });

  return imageId;
}

export function registerNaturalizedDatasetsForLocalWadouri(instances, options = {}) {
  const list = Array.isArray(instances) ? instances : [instances];
  const { referencedImageIds = [] } = options;

  list.forEach(instance =>
    registerNaturalizedDatasetForLocalWadouri(instance, { referencedImageIds })
  );

  return list;
}
