import { SOPClassHandlerId } from './id';
import { utils } from '@ohif/core';
import i18n from '@ohif/i18n';
import { utilities as csUtils, Enums as csEnums } from '@cornerstonejs/core';

const SOP_CLASS_UIDS = {
  VIDEO_MICROSCOPIC_IMAGE_STORAGE: '1.2.840.10008.5.1.4.1.1.77.1.2.1',
  VIDEO_PHOTOGRAPHIC_IMAGE_STORAGE: '1.2.840.10008.5.1.4.1.1.77.1.4.1',
  VIDEO_ENDOSCOPIC_IMAGE_STORAGE: '1.2.840.10008.5.1.4.1.1.77.1.1.1',
  /** Need to use fallback, could be video or image */
  SECONDARY_CAPTURE_IMAGE_STORAGE: '1.2.840.10008.5.1.4.1.1.7',
  MULTIFRAME_TRUE_COLOR_SECONDARY_CAPTURE_IMAGE_STORAGE: '1.2.840.10008.5.1.4.1.1.7.4',
};

const sopClassUids = Object.values(SOP_CLASS_UIDS);
const secondaryCaptureSopClassUids = [
  SOP_CLASS_UIDS.SECONDARY_CAPTURE_IMAGE_STORAGE,
  SOP_CLASS_UIDS.MULTIFRAME_TRUE_COLOR_SECONDARY_CAPTURE_IMAGE_STORAGE,
];

const SupportedTransferSyntaxes = {
  MPEG4_AVC_264_HIGH_PROFILE: '1.2.840.10008.1.2.4.102',
  MPEG4_AVC_264_BD_COMPATIBLE_HIGH_PROFILE: '1.2.840.10008.1.2.4.103',
  MPEG4_AVC_264_HIGH_PROFILE_FOR_2D_VIDEO: '1.2.840.10008.1.2.4.104',
  MPEG4_AVC_264_HIGH_PROFILE_FOR_3D_VIDEO: '1.2.840.10008.1.2.4.105',
  MPEG4_AVC_264_STEREO_HIGH_PROFILE: '1.2.840.10008.1.2.4.106',
  HEVC_265_MAIN_PROFILE: '1.2.840.10008.1.2.4.107',
  HEVC_265_MAIN_10_PROFILE: '1.2.840.10008.1.2.4.108',
};

const supportedTransferSyntaxUIDs = Object.values(SupportedTransferSyntaxes);

/** The recognizer: is the instance a video that this handler can play? */
const isSupportedVideo = metadata => {
  const tsuid =
    metadata.AvailableTransferSyntaxUID || metadata.TransferSyntaxUID || metadata['00083002'];

  if (supportedTransferSyntaxUIDs.includes(tsuid)) {
    return true;
  }

  if (metadata.SOPClassUID === SOP_CLASS_UIDS.VIDEO_PHOTOGRAPHIC_IMAGE_STORAGE) {
    return true;
  }

  // Assume that an instance with one of the secondary capture SOPClassUIDs and
  // with at least 90 frames (i.e. typically 3 seconds of video) is indeed a video.
  return (
    secondaryCaptureSopClassUids.includes(metadata.SOPClassUID) && metadata.NumberOfFrames >= 90
  );
};

/**
 * The video fields of a display set that shows `instance`, and the
 * registration of its rendered URL. Shared by the legacy builder and
 * {@link extendVideoDisplaySet}.
 */
const getVideoFields = (instance, dataSource) => {
  const { Modality, SOPInstanceUID, SeriesDescription = 'VIDEO', imageId } = instance;
  const { SeriesNumber, NumberOfFrames, url } = instance;
  // The date/time of a display set is the date/time of the instance it
  // shows, chosen from all the attributes that instance carries.
  const { SeriesDate, SeriesTime } = utils.getLatestInstanceDateTime(instance);
  const videoUrlParams = {
    instance,
    singlepart: 'video',
    tag: 'PixelData',
    url,
  };
  const videoUrl = dataSource.retrieve.directURL(videoUrlParams);
  const getVideoUrl = dataSource.retrieve.renderedURL
    ? options => dataSource.retrieve.renderedURL({ ...videoUrlParams, url: videoUrl }, options)
    : undefined;
  csUtils.genericMetadataProvider.add(imageId, {
    type: 'imageUrlModule',
    metadata: { rendered: videoUrl },
  });
  return {
    //plugin: id,
    Modality,
    SeriesDescription,
    SeriesNumber,
    SeriesDate,
    SeriesTime,
    SOPInstanceUID,
    SOPClassHandlerId,
    referencedImages: null,
    measurements: null,
    videoUrl,
    getVideoUrl,
    viewportType: csEnums.ViewportType.VIDEO,
    getThumbnailSrc: dataSource.retrieve.getGetThumbnailSrc?.(instance),
    thumbnailSrc: null,
    imageIds: [imageId],
    isDerivedDisplaySet: true,
    isLoaded: false,
    sopClassUids,
    numImageFrames: NumberOfFrames,
    instance,
    supportsWindowLevel: true,
    label: SeriesDescription || `${i18n.t('Series')} ${SeriesNumber} - ${i18n.t(Modality)}`,
  };
};

const _getDisplaySetsFromSeries = (instances, servicesManager, extensionManager) => {
  const dataSource = extensionManager.getActiveDataSource()[0];
  console.warn('dataSource=', dataSource);
  return instances.filter(isSupportedVideo).map(instance => {
    const { SeriesInstanceUID, StudyInstanceUID } = instance;
    return {
      ...getVideoFields(instance, dataSource),
      displaySetInstanceUID: utils.guid(),
      SeriesInstanceUID,
      StudyInstanceUID,
      instances: [instance],
    };
  });
};

/**
 * Adds the video fields to a display set that a split rule with the `video`
 * handler made. The rule recognizes the video, so the recognizer of the legacy
 * builder does not run here. The display set shows its first instance.
 */
const extendVideoDisplaySet = (displaySet, { extensionManager }) => {
  const dataSource = extensionManager.getActiveDataSource()[0];
  Object.assign(displaySet, getVideoFields(displaySet.instances[0], dataSource));
};

export default function getSopClassHandlerModule(params) {
  const { servicesManager, extensionManager } = params;
  const getDisplaySetsFromSeries = instances => {
    return _getDisplaySetsFromSeries(instances, servicesManager, extensionManager);
  };

  return [
    {
      name: 'dicom-video',
      sopClassUids,
      getDisplaySetsFromSeries,
      handlerNames: ['video'],
      extendDisplaySet: extendVideoDisplaySet,
    },
  ];
}
