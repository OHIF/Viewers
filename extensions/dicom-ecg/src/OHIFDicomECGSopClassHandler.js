import { MODULE_TYPES, utils } from '@ohif/core';

// TODO: Should probably use dcmjs for this
const SOP_CLASS_UIDS = {
  Sop12LeadECGWaveformStorage: '1.2.840.10008.5.1.4.1.1.9.1.1',
  GeneralECGWaveformStorage: '1.2.840.10008.5.1.4.1.1.9.1.2',
  AmbulatoryECGWaveformStorage: '1.2.840.10008.5.1.4.1.1.9.1.3',
  HemodynamicWaveformStorage: '1.2.840.10008.5.1.4.1.1.9.2.1',
};

const OHIFDicomECGSopClassHandler = {
  id: 'OHIFDicomECGSopClassHandlerPlugin',
  type: MODULE_TYPES.SOP_CLASS_HANDLER,
  sopClassUIDs: [
    SOP_CLASS_UIDS.Sop12LeadECGWaveformStorage,
    SOP_CLASS_UIDS.GeneralECGWaveformStorage,
    SOP_CLASS_UIDS.AmbulatoryECGWaveformStorage,
    SOP_CLASS_UIDS.HemodynamicWaveformStorage,
  ],
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
      plugin: 'ecg',
      Modality: 'ECG',
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

export default OHIFDicomECGSopClassHandler;
