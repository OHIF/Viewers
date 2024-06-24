import { SOPClassHandlerId } from './id';
import { utils } from '@ohif/core';

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

const _getDisplaySetsFromSeries = (instances, servicesManager, extensionManager) => {
  const dataSource = extensionManager.getActiveDataSource()[0];
  return instances
    .filter(metadata => {
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
    })
    .map(instance => {
      const { Modality, SOPInstanceUID, SeriesDescription = 'VIDEO' } = instance;
      const { SeriesNumber, SeriesDate, SeriesInstanceUID, StudyInstanceUID, NumberOfFrames, url } =
        instance;
      const videoUrl = dataSource.retrieve.directURL({
        instance,
        singlepart: 'video',
        tag: 'PixelData',
        url,
      });
      const displaySet = {
        //plugin: id,
        Modality,
        displaySetInstanceUID: utils.guid(),
        SeriesDescription,
        SeriesNumber,
        SeriesDate,
        SOPInstanceUID,
        SeriesInstanceUID,
        StudyInstanceUID,
        SOPClassHandlerId,
        referencedImages: null,
        measurements: null,
        videoUrl,
        instances: [instance],
        thumbnailSrc: dataSource.retrieve.directURL({
          instance,
          defaultPath: '/thumbnail',
          defaultType: 'image/jpeg',
          tag: 'Absent',
        }),
        isDerivedDisplaySet: true,
        isLoaded: false,
        sopClassUids,
        numImageFrames: NumberOfFrames,
        instance,
      };
      return displaySet;
    });
};

export default function getSopClassHandlerModule({ servicesManager, extensionManager }) {
  const getDisplaySetsFromSeries = instances => {
    return _getDisplaySetsFromSeries(instances, servicesManager, extensionManager);
  };

  return [
    {
      name: 'dicom-video',
      sopClassUids,
      getDisplaySetsFromSeries,
    },
  ];
}
