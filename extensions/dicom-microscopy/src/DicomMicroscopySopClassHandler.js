import OHIF from '@ohif/core';

const { utils } = OHIF;

const SOP_CLASS_UIDS = {
  VL_WHOLE_SLIDE_MICROSCOPY_IMAGE_STORAGE: '1.2.840.10008.5.1.4.1.1.77.1.6',
};

const DicomMicroscopySopClassHandler = {
  id: 'DicomMicroscopySopClassHandlerPlugin',
  sopClassUIDs: [SOP_CLASS_UIDS.VL_WHOLE_SLIDE_MICROSCOPY_IMAGE_STORAGE],
  getDisplaySetFromSeries(series, study, dicomWebClient) {
    const instance = series.getFirstInstance();

    const metadata = instance.getData().metadata;
    const {
      SeriesDescription,
      SeriesNumber,
      ContentDate,
      ContentTime,
    } = metadata;

    // Note: We are passing the dicomweb client into each viewport!

    return {
      plugin: 'microscopy',
      Modality: 'SM',
      displaySetInstanceUID: utils.guid(),
      dicomWebClient,
      SOPInstanceUID: instance.getSOPInstanceUID(),
      SeriesInstanceUID: series.getSeriesInstanceUID(),
      StudyInstanceUID: study.getStudyInstanceUID(),
      SeriesDescription,
      SeriesDate: ContentDate, // Map ContentDate/Time to SeriesTime for series list sorting.
      SeriesTime: ContentTime,
      SeriesNumber,
      metadata,
    };
  },
};

export default DicomMicroscopySopClassHandler;
