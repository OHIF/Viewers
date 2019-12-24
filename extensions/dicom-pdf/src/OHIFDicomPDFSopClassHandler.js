import { MODULE_TYPES, utils } from '@ohif/core';

// TODO: Should probably use dcmjs for this
const SOP_CLASS_UIDS = {
  ENCAPSULATED_PDF: '1.2.840.10008.5.1.4.1.1.104.1',
};

const OHIFDicomPDFSopClassHandler = {
  id: 'OHIFDicomPDFSopClassHandlerPlugin',
  type: MODULE_TYPES.SOP_CLASS_HANDLER,
  sopClassUids: [SOP_CLASS_UIDS.ENCAPSULATED_PDF],
  getDisplaySetFromSeries(series, study, dicomWebClient, authorizationHeaders) {
    const instance = series.getFirstInstance();

    return {
      plugin: 'pdf',
      modality: 'DOC',
      displaySetInstanceUid: utils.guid(),
      wadoRoot: study.getData().wadoRoot,
      wadoUri: instance.getData().wadouri,
      sopInstanceUid: instance.getSOPInstanceUID(),
      seriesInstanceUid: series.getSeriesInstanceUID(),
      studyInstanceUid: study.getStudyInstanceUID(),
      authorizationHeaders: authorizationHeaders,
    };
  },
};

export default OHIFDicomPDFSopClassHandler;
