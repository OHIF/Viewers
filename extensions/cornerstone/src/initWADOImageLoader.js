import cornerstone from 'cornerstone-core';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import dicomParser from 'dicom-parser';

//import { initWebWorkers } from './utils/index.js';

cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

cornerstoneWADOImageLoader.configure({
  beforeSend: function(xhr) {
    /*const headers = OHIF.DICOMWeb.getAuthorizationHeader();

    if (headers.Authorization) {
      xhr.setRequestHeader('Authorization', headers.Authorization);
    }*/
  },
});
