import OHIF from "ohif-core";

const { plugins, utils } = OHIF;
const { PLUGIN_TYPES } = plugins;

// TODO: Should probably use dcmjs for this
const SOP_CLASS_UIDS = {
  ENCAPSULATED_PDF: '1.2.840.10008.5.1.4.1.1.104.1'
};

const OHIFDicomPDFSopClassHandlerPlugin = {
  id: 'OHIFDicomPDFSopClassHandlerPlugin',
  type: PLUGIN_TYPES.SOP_CLASS_HANDLER,
  sopClassUids: [
    SOP_CLASS_UIDS.ENCAPSULATED_PDF
  ],
  getDisplaySetFromSeries(series, study) {
    const instance = series.getFirstInstance();

    return {
      plugin: 'pdf',
      displaySetInstanceUid: utils.guid(),
      wadoRoot: study.getData().wadoRoot,
      wadoUri: instance.getData().wadouri,
      sopInstanceUid: instance.getSOPInstanceUID(),
      seriesInstanceUid: series.getSeriesInstanceUID(),
      studyInstanceUid: study.getStudyInstanceUID()
    };
  }
}

export default OHIFDicomPDFSopClassHandlerPlugin;
