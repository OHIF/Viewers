import OHIF from '@ohif/core';

const { utils, metadata } = OHIF;
const { OHIFSeriesMetadata } = metadata;

const SOP_CLASS_UIDS = {
  VIDEO_MICROSCOPIC_IMAGE_STORAGE: '1.2.840.10008.5.1.4.1.1.77.1.2.1',
  VIDEO_PHOTOGRAPHIC_IMAGE_STORAGE: '1.2.840.10008.5.1.4.1.1.77.1.4.1',
  VIDEO_ENDOSCOPIC_IMAGE_STORAGE: '1.2.840.10008.5.1.4.1.1.77.1.1.1',
  /** Need to use fallback, could be video or image */
  SECONDARY_CAPTURE_IMAGE_STORAGE: '1.2.840.10008.5.1.4.1.1.7',
  MULTIFRAME_TRUE_COLOR_SECONDARY_CAPTURE_IMAGE_STORAGE:
    '1.2.840.10008.5.1.4.1.1.7.4',
};

const sopClassUIDs = Object.values(SOP_CLASS_UIDS);

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

function generateVideoUrl(baseWadoRsUri, metadata) {
  const { StudyInstanceUID } = metadata;
  // If the BulkDataURI isn't present, then assume it uses the pixeldata endpoint
  // The standard isn't quite clear on that, but appears to be what is expected
  const BulkDataURI =
    (metadata.PixelData && metadata.PixelData.BulkDataURI) ||
    `series/${metadata.SeriesInstanceUID}/instances/${metadata.SOPInstanceUID}/pixeldata`;
  const hasQuery = BulkDataURI.indexOf('?') != -1;
  const hasAccept = BulkDataURI.indexOf('accept=') != -1;
  const wadoRoot = baseWadoRsUri.substring(
    0,
    baseWadoRsUri.indexOf('/studies')
  );
  const acceptUri =
    BulkDataURI +
    (hasAccept ? '' : (hasQuery ? '&' : '?') + 'accept=video/mp4');
  if (BulkDataURI.indexOf('http') == 0) return acceptUri;
  if (BulkDataURI.indexOf('/') == 0) return wadoRoot + acceptUri;
  if (BulkDataURI.indexOf('series/') == 0) {
    return `${wadoRoot}/studies/${StudyInstanceUID}/${acceptUri}`;
  }
  throw new Error('BulkDataURI in unknown format:' + BulkDataURI);
}

const DICOMVideoSopClassHandler = {
  id: 'DICOMVideoSopClassHandlerPlugin',
  sopClassUIDs,

  getDisplaySetFromSeries: function getDisplaySetFromSeries(
    series,
    study,
    dicomWebClient
  ) {
    console.log('Video:getDisplaySetFromSeries');
    return series._instances
      .filter(i => {
        const metadata = i.getData().metadata;
        const tsuid =
          metadata.AvailableTransferSyntaxUID || metadata.TransferSyntaxUID;
        const hasSopMapping = sopClassUIDs.includes(metadata.SOPClassUID);
        const supportedVideo = supportedTransferSyntaxUIDs.includes(tsuid);
        if (hasSopMapping && !supportedVideo) {
          console.warn("SOP", metadata.SOPClassUID, "is video supported, but",
            tsuid, "not supported on instance ", metadata.SOPInstanceUID);
        }
        console.log('video has mapping:', hasSopMapping, supportedVideo);
        return hasSopMapping && supportedVideo;
      })
      .map(instance => {
        const metadata = instance.getData().metadata;

        const { baseWadoRsUri } = instance.getData();
        const { Modality, FrameOfReferenceUID, SOPInstanceUID } = metadata;
        const { SeriesDescription, ContentDate, ContentTime } = metadata;
        const { SeriesNumber, SeriesInstanceUID, StudyInstanceUID } = metadata;

        return {
          plugin: 'video',
          Modality,
          displaySetInstanceUID: utils.guid(),
          dicomWebClient,
          SOPInstanceUID,
          SeriesInstanceUID,
          StudyInstanceUID,
          referenceInstance: instance,
          videoUrl: generateVideoUrl(baseWadoRsUri, metadata),
          others: [instance],
          thumbnailSrc: baseWadoRsUri + '/thumbnail',
          imageId: metadata.imageId,
          FrameOfReferenceUID,
          metadata,
          SeriesDescription,
          SeriesDate: ContentDate,
          SeriesTime: ContentTime,
          SeriesNumber,
        };
      });
  },
};

export default DICOMVideoSopClassHandler;
