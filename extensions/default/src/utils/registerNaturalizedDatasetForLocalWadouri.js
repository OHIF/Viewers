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

/**
 * Registers a naturalized DICOM dataset with the wadouri file manager so it can be
 * loaded like other locally stored instances (blob URL), instead of remote wadors URLs.
 *
 * @param {object} dataset - Naturalized DICOM instance (e.g. generated SEG).
 * @param {object} [options]
 * @param {string[]} [options.referencedImageIds] - Used for logging / frame count hints.
 * @returns {string} wadouri imageId assigned to dataset.url
 */
export function registerNaturalizedDatasetForLocalWadouri(dataset, options = {}) {
  const { referencedImageIds = [] } = options;
  const blob = datasetToDicomBlob(dataset);
  const imageId = dicomImageLoader.wadouri.fileManager.add(blob);

  setNonEnumerableInstanceProperty(dataset, 'url', imageId);

  const { StudyInstanceUID, SeriesInstanceUID } = dataset;
  const SOPInstanceUID = dataset.SOPInstanceUID || dataset.SopInstanceUID;

  const perFrameGroups = dataset.PerFrameFunctionalGroupsSequence;
  if (Array.isArray(perFrameGroups) && !dataset.NumberOfFrames) {
    dataset.NumberOfFrames = perFrameGroups.length;
  }

  const numberOfFrames = Math.max(
    Number(dataset.NumberOfFrames) || 0,
    Array.isArray(perFrameGroups) ? perFrameGroups.length : 0,
    1
  );
  dataset.NumberOfFrames = numberOfFrames;

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
