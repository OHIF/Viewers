import * as cornerstone from '@cornerstonejs/core';
import { volumeLoader } from '@cornerstonejs/core';
import { cornerstoneStreamingImageVolumeLoader } from '@cornerstonejs/streaming-image-volume-loader';
import dicomImageLoader, {
  webWorkerManager,
} from '@cornerstonejs/dicom-image-loader';
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
    dicomImageLoader.webWorkerManager.initialize(config);
    initialized = true;
  }
}

export default function initWADOImageLoader(
  userAuthenticationService,
  appConfig
) {
  dicomImageLoader.external.cornerstone = cornerstone;
  dicomImageLoader.external.dicomParser = dicomParser;

  registerVolumeLoader(
    'cornerstoneStreamingImageVolume',
    cornerstoneStreamingImageVolumeLoader
  );

  dicomImageLoader.configure({
    decodeConfig: {
      // !! IMPORTANT !!
      // We should set this flag to false, since, by default @cornerstonejs/dicom-image-loader
      // will convert everything to integers (to be able to work with cornerstone-2d).
      // Until the default is set to true (which is the case for cornerstone3D),
      // we should set this flag to false.
      convertFloatPixelDataToInt: false,
    },
    beforeSend: function (xhr) {
      const headers = userAuthenticationService.getAuthorizationHeader();

      // Request:
      // JPEG-LS Lossless (1.2.840.10008.1.2.4.80) if available, otherwise accept
      // whatever transfer-syntax the origin server provides.
      // For now we use image/jls and image/x-jls because some servers still use the old type
      // http://dicom.nema.org/medical/dicom/current/output/html/part18.html

      //Initialize the accept header content
      const acceptHeader = ['multipart/related']
      //Storing the requesting transfer syntax specified in OHIF config
      const requestTransferSyntaxUID = appConfig.requestTransferSyntaxUID

      if (requestTransferSyntaxUID) {
        //Check TS is valid
        if (!Object.keys(typeForTS).includes(requestTransferSyntaxUID)) {
          console.warn(requestTransferSyntaxUID + 'is unexpected')
        } else {
          //Fetch type header according to requesting TS
          let type = typeForTS[requestTransferSyntaxUID]
          if (type === 'application/octet-stream' && !appConfig.omitQuotationForMultipartRequest) {
            type = '"application/octet-stream"'
          }
          acceptHeader.push('type=' + type)
          acceptHeader.push('transfer-syntax=' + requestTransferSyntaxUID)
        }

      }
      const xhrRequestHeaders = {
        //Serialize Accept header
        Accept: acceptHeader.join('; ')
      }

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

/*
taken from
https://hg.orthanc-server.com/orthanc-dicomweb/file/tip/Plugin/WadoRsRetrieveFrames.cpp
*/
const typeForTS = {
  "*": "application/octet-stream",
  "1.2.840.10008.1.2.1": "application/octet-stream",
  "1.2.840.10008.1.2": "application/octet-stream",
  "1.2.840.10008.1.2.2": "application/octet-stream",
  "1.2.840.10008.1.2.4.70": "image/jpeg",
  "1.2.840.10008.1.2.4.50": "image/jpeg",
  "1.2.840.10008.1.2.4.51": "image/dicom+jpeg",
  "1.2.840.10008.1.2.4.57": "image/jpeg",
  "1.2.840.10008.1.2.5": "image/dicom-rle",
  "1.2.840.10008.1.2.4.80": "image/jls",
  "1.2.840.10008.1.2.4.81": "image/jls",
  "1.2.840.10008.1.2.4.90": "image/jp2",
  "1.2.840.10008.1.2.4.91": "image/jp2",
  "1.2.840.10008.1.2.4.92": "image/jpx",
  "1.2.840.10008.1.2.4.93": "image/jpx",
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
