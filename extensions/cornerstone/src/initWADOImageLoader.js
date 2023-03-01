import * as cornerstone from '@cornerstonejs/core';
import { volumeLoader } from '@cornerstonejs/core';
import { cornerstoneStreamingImageVolumeLoader } from '@cornerstonejs/streaming-image-volume-loader';
import cornerstoneWADOImageLoader, {
  webWorkerManager,
} from 'cornerstone-wado-image-loader';
import dicomParser from 'dicom-parser';
import { errorHandler } from '@ohif/core';

const { registerVolumeLoader } = volumeLoader;

let initialized = false;

function initWebWorkers(appConfig) {
  const config = {
    maxWebWorkers: Math.min(
      Math.max(navigator.hardwareConcurrency - 1, 1),
      appConfig.maxNumberOfWebWorkers
    ),
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

export default function initWADOImageLoader(
  userAuthenticationService,
  appConfig
) {
  cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
  cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

  registerVolumeLoader(
    'cornerstoneStreamingImageVolume',
    cornerstoneStreamingImageVolumeLoader
  );

  cornerstoneWADOImageLoader.configure({
    decodeConfig: {
      // !! IMPORTANT !!
      // We should set this flag to false, since, by default cornerstone-wado-image-loader
      // will convert everything to integers (to be able to work with cornerstone-2d).
      // Until the default is set to true (which is the case for cornerstone3D),
      // we should set this flag to false.
      convertFloatPixelDataToInt: false,
    },
    beforeSend: function(xhr) {
      const headers = userAuthenticationService.getAuthorizationHeader();

      // Request:
      // JPEG-LS Lossless (1.2.840.10008.1.2.4.80) if available, otherwise accept
      // whatever transfer-syntax the origin server provides.
      // For now we use image/jls and image/x-jls because some servers still use the old type
      // http://dicom.nema.org/medical/dicom/current/output/html/part18.html
      const xhrRequestHeaders = {
        Accept: appConfig.omitQuotationForMultipartRequest
          ? 'multipart/related; type=application/octet-stream'
          : 'multipart/related; type="application/octet-stream"',
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

  initWebWorkers(appConfig);
}

export function destroy() {
  // Note: we don't want to call .terminate on the webWorkerManager since
  // that resets the config
  const webWorkers = webWorkerManager.webWorkers;
  for (let i = 0; i < webWorkers.length; i++) {
    webWorkers[i].worker.terminate();
  }
  webWorkers.length = 0;
}
