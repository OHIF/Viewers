import * as cornerstone from '@cornerstonejs/core';
import { volumeLoader } from '@cornerstonejs/core';
import {
  cornerstoneStreamingImageVolumeLoader,
  cornerstoneStreamingDynamicImageVolumeLoader,
} from '@cornerstonejs/streaming-image-volume-loader';
import dicomImageLoader, { webWorkerManager } from '@cornerstonejs/dicom-image-loader';
import dicomParser from 'dicom-parser';
import { errorHandler, utils } from '@ohif/core';

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
  appConfig,
  extensionManager
) {
  dicomImageLoader.external.cornerstone = cornerstone;
  dicomImageLoader.external.dicomParser = dicomParser;

  registerVolumeLoader('cornerstoneStreamingImageVolume', cornerstoneStreamingImageVolumeLoader);

  registerVolumeLoader(
    'cornerstoneStreamingDynamicImageVolume',
    cornerstoneStreamingDynamicImageVolumeLoader
  );

  dicomImageLoader.configure({
    decodeConfig: {
      // !! IMPORTANT !!
      // We should set this flag to false, since, by default @cornerstonejs/dicom-image-loader
      // will convert everything to integers (to be able to work with cornerstone-2d).
      // Until the default is set to true (which is the case for cornerstone3D),
      // we should set this flag to false.
      convertFloatPixelDataToInt: false,
      use16BitDataType:
        Boolean(appConfig.useNorm16Texture) || Boolean(appConfig.preferSizeOverAccuracy),
    },
    beforeSend: function (xhr) {
      //TODO should be removed in the future and request emitted by DicomWebDataSource
      const sourceConfig = extensionManager.getActiveDataSource()?.[0].getConfig() ?? {};
      const headers = userAuthenticationService.getAuthorizationHeader();
      const acceptHeader = utils.generateAcceptHeader(
        sourceConfig.acceptHeader,
        sourceConfig.requestTransferSyntaxUID,
        sourceConfig.omitQuotationForMultipartRequest
      );

      const xhrRequestHeaders = {
        Accept: acceptHeader,
      };

      if (headers) {
        Object.assign(xhrRequestHeaders, headers);
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
