import { MODULE_TYPES, utils } from '@ohif/core';

// TODO: Should probably use dcmjs for this
const SOP_CLASS_UIDS = {
  ENCAPSULATED_PDF: '1.2.840.10008.5.1.4.1.1.104.1',
};

const OHIFDicomPDFSopClassHandler = {
  id: 'OHIFDicomPDFSopClassHandlerPlugin',
  type: MODULE_TYPES.SOP_CLASS_HANDLER,
  sopClassUIDs: [SOP_CLASS_UIDS.ENCAPSULATED_PDF],
  getDisplaySetFromSeries(series, study, dicomWebClient, authorizationHeaders) {
    const instance = series.getFirstInstance();

    const metadata = instance.getData().metadata;
    const {
      ContentDate,
      ContentTime,
      SeriesDescription,
      SeriesNumber,
    } = metadata;

    return {
      plugin: 'pdf',
      Modality: 'DOC',
      displaySetInstanceUID: utils.guid(),
      wadoRoot: study.getData().wadoRoot,
      wadoUri: instance.getData().wadouri,
      SOPInstanceUID: instance.getSOPInstanceUID(),
      SeriesInstanceUID: series.getSeriesInstanceUID(),
      StudyInstanceUID: study.getStudyInstanceUID(),
      SeriesDescription,
      SeriesDate: ContentDate, // Map ContentDate/Time to SeriesTime for series list sorting.
      SeriesTime: ContentTime,
      SeriesNumber,
      metadata,
      authorizationHeaders: authorizationHeaders,
    };
  },
};

export default OHIFDicomPDFSopClassHandler;
