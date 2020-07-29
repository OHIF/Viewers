import OHIF from '@ohif/core';
import { SOPClassHandlerName } from '@ohif/extension-dicom-sr/src/id';
import { api } from 'dicomweb-client';
import DICOMWeb from '@ohif/core/src/DICOMWeb';
import errorHandler from '@ohif/core/src/errorHandler';
const { utils } = OHIF;

const SOP_CLASS_UIDS = {
  VL_WHOLE_SLIDE_MICROSCOPY_IMAGE_STORAGE: '1.2.840.10008.5.1.4.1.1.77.1.6',
};

function getSopClassHandlerModule({ servicesManager, extensionManager }) {
  return [
    {
      name: 'microscopy',
      sopClassUids: [SOP_CLASS_UIDS.VL_WHOLE_SLIDE_MICROSCOPY_IMAGE_STORAGE],
      getDisplaySetsFromSeries(instances) {

        // TODO: get from data source
        const url = 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs';

        // TODO: get from config or something?
        // const errorInterceptor

        const config = {
          url,
          headers: {} //DICOMWeb.getAuthorizationHeader(server),
          //errorInterceptor: //errorHandler.getHTTPErrorHandler(),
        };
        const dicomWebClient = new api.DICOMwebClient(config);
        const instance = instances[0];

        // Note: We are passing the dicomweb client into each viewport!
        return [{
          SOPClassHandlerId: 'org.ohif.microscopy.sopClassHandlerModule.microscopy',
          Modality: 'SM',
          displaySetInstanceUID: utils.guid(),
          dicomWebClient,
          SOPInstanceUID: instance.SOPInstanceUID,
          SeriesInstanceUID: instance.SeriesInstanceUID,
          StudyInstanceUID: instance.StudyInstanceUID,
        }];
      },
    }
  ];
}

export default getSopClassHandlerModule;
