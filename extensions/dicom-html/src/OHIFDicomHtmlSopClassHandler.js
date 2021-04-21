import { MODULE_TYPES, utils } from '@ohif/core';

// TODO: Should probably use dcmjs for this
const SOP_CLASS_UIDS = {
  BASIC_TEXT_SR: '1.2.840.10008.5.1.4.1.1.88.11',
  ENHANCED_SR: '1.2.840.10008.5.1.4.1.1.88.22',
  COMPREHENSIVE_SR: '1.2.840.10008.5.1.4.1.1.88.33',
  PROCEDURE_LOG_STORAGE: '1.2.840.10008.5.1.4.1.1.88.40',
  MAMMOGRAPHY_CAD_SR: '1.2.840.10008.5.1.4.1.1.88.50',
  CHEST_CAD_SR: '1.2.840.10008.5.1.4.1.1.88.65',
  X_RAY_RADIATION_DOSE_SR: '1.2.840.10008.5.1.4.1.1.88.67',
  ACQUISITION_CONTEXT_SR_STORAGE: '1.2.840.10008.5.1.4.1.1.88.71',
};

const sopClassUIDs = Object.values(SOP_CLASS_UIDS);

// TODO: Handle the case where there is more than one SOP Class Handler for the
// same SOP Class
const OHIFDicomHtmlSopClassHandler = {
  id: 'OHIFDicomHtmlSopClassHandler',
  type: MODULE_TYPES.SOP_CLASS_HANDLER,
  sopClassUIDs,
  getDisplaySetFromSeries(series, study, dicomWebClient, authorizationHeaders) {
    const instance = series.getFirstInstance();

    const metadata = instance.getData().metadata;
    const {
      SeriesDescription,
      SeriesNumber,
      SeriesDate,
      SeriesTime,
    } = metadata;

    return {
      plugin: 'html',
      Modality: 'SR',
      displaySetInstanceUID: utils.guid(),
      wadoRoot: study.getData().wadoRoot,
      wadoUri: instance.getData().wadouri,
      SOPInstanceUID: instance.getSOPInstanceUID(),
      SeriesInstanceUID: series.getSeriesInstanceUID(),
      StudyInstanceUID: study.getStudyInstanceUID(),
      SeriesDescription,
      metadata,
      SeriesDate,
      SeriesTime,
      SeriesNumber,
      authorizationHeaders,
    };
  },
};

export default OHIFDicomHtmlSopClassHandler;
