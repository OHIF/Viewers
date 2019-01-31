import OHIF from 'ohif-core';

const { plugins, utils } = OHIF;
const { PLUGIN_TYPES } = plugins;

const SOP_CLASS_UIDS = {
  VL_WHOLE_SLIDE_MICROSCOPY_IMAGE_STORAGE: '1.2.840.10008.5.1.4.1.1.77.1.6'
};

const DicomMicrscopySopClassHandler = {
  id: 'DicomMicroscopySopClassHandlerPlugin',
  type: PLUGIN_TYPES.SOP_CLASS_HANDLER,
  sopClassUids: [SOP_CLASS_UIDS.VL_WHOLE_SLIDE_MICROSCOPY_IMAGE_STORAGE],
  getDisplaySetFromSeries(series, study, dicomWebClient) {
    const instance = series.getFirstInstance();

    // Note: We are passing the dicomweb client into each viewport!

    return {
      plugin: 'microscopy',
      displaySetInstanceUid: utils.guid(),
      dicomWebClient,
      sopInstanceUid: instance.getSOPInstanceUID(),
      seriesInstanceUid: series.getSeriesInstanceUID(),
      studyInstanceUid: study.getStudyInstanceUID()
    };
  }
};

export default DicomMicrscopySopClassHandler;
