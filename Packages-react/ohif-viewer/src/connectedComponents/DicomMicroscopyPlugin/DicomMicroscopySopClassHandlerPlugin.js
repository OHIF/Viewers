import OHIF from 'ohif-core';
import { api } from 'dicomweb-client';

const { plugins, utils } = OHIF;
const { PLUGIN_TYPES } = plugins;

const SOP_CLASS_UIDS = {
  VL_WHOLE_SLIDE_MICROSCOPY_IMAGE_STORAGE: '1.2.840.10008.5.1.4.1.1.77.1.6'
};

const dwc = api.DICOMwebClient;

const DicomMicrscopySopClassHandlerPlugin = {
  id: 'DicomMicroscopySopClassHandlerPlugin',
  type: PLUGIN_TYPES.SOP_CLASS_HANDLER,
  sopClassUids: [SOP_CLASS_UIDS.VL_WHOLE_SLIDE_MICROSCOPY_IMAGE_STORAGE],
  getDisplaySetFromSeries(series, study) {
    const instance = series.getFirstInstance();

    const headers = OHIF.DICOMWeb.getAuthorizationHeader();
    console.warn(headers);

    debugger;

    const dicomWebClient = new dwc({
      url: study.getData().wadoRoot,
      headers
    });

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

export default DicomMicrscopySopClassHandlerPlugin;
