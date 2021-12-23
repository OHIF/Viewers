import cornerstone from 'cornerstone-core';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import dicomParser from 'dicom-parser';
import { errorHandler } from '@ohif/core';

let initialized = false;

function initWebWorkers() {
  const config = {
    maxWebWorkers: Math.max(navigator.hardwareConcurrency - 1, 1),
    startWebWorkersOnDemand: true,
    taskConfiguration: {
      decodeTask: {
        initializeCodecsOnStartup: false,
        usePDFJS: false,
        strict: false,
      },
    },
  };

  if (!initialized) {
    cornerstoneWADOImageLoader.webWorkerManager.initialize(config);
    initialized = true;
  }
}

export default function initWADOImageLoader(UserAuthenticationService) {
  cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
  cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

  cornerstoneWADOImageLoader.configure({
    beforeSend: function(xhr) {
      const headers = UserAuthenticationService.getAuthorizationHeader();

      // Request:
      // JPEG-LS Lossless (1.2.840.10008.1.2.4.80) if available, otherwise accept
      // whatever transfer-syntax the origin server provides.
      // For now we use image/jls and image/x-jls because some servers still use the old type
      // http://dicom.nema.org/medical/dicom/current/output/html/part18.html
      const xhrRequestHeaders = {
        // To prevent Preflight requests:
        accept: 'multipart/related; type=application/octet-stream',
        //
        //accept: 'multipart/related; type="image/x-jls"',
        // 'multipart/related; type="image/x-jls", multipart/related; type="image/jls"; transfer-syntax="1.2.840.10008.1.2.4.80", multipart/related; type="image/x-jls", multipart/related; type="application/octet-stream"; transfer-syntax=*',
      };

      if (headers && headers.Authorization) {
        xhrRequestHeaders.Authorization = headers.Authorization;
      }

      return xhrRequestHeaders;
    },
    errorInterceptor: error => {
      errorHandler.getHTTPErrorHandler(error);
    },
  });

  initWebWorkers();
}
