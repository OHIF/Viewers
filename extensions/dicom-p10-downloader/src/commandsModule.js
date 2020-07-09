import OHIF from '@ohif/core';
import {
  save,
  upload,
  getDicomWebClientFromContext,
  getStudyInstanceUIDFromStudies,
  getSOPInstanceReferenceFromActiveViewport,
  getSOPInstanceReferencesFromViewports,
} from './utils';
import _downloadAndZip, { downloadInstances } from './downloadAndZip';

const {
  utils: { Queue },
} = OHIF;

export function getCommands(context) {
  const queue = new Queue(1);
  const actions = {
    /**
     * @example Running this command using Commands Manager
     * commandsManager.runCommand(
     *   'downloadAndZip',
     *   {
     *     listOfUIDs: [...],
     *     options: {
     *       progress(status) {
     *         console.info('Progress:', (status.progress * 100).toFixed(2) + '%');
     *       }
     *     }
     *   },
     *   'VIEWER'
     * );
     */
    downloadAndZip({ servers, dicomWebClient, listOfUIDs, options }) {
      return save(
        _downloadAndZip(
          dicomWebClient || getDicomWebClientFromContext(context, servers),
          listOfUIDs,
          options
        ),
        listOfUIDs
      );
    },
    downloadAndZipStudy({ servers, studies, progress }) {
      const dicomWebClient = getDicomWebClientFromContext(context, servers);
      const listOfUIDs = getStudyInstanceUIDFromStudies(studies);
      return save(
        _downloadAndZip(dicomWebClient, listOfUIDs, { progress }),
        listOfUIDs
      );
    },
    downloadAndZipSeriesOnViewports({ servers, viewports, progress }) {
      const dicomWebClient = getDicomWebClientFromContext(context, servers);
      const listOfUIDs = getSOPInstanceReferencesFromViewports(viewports);
      return save(
        _downloadAndZip(dicomWebClient, listOfUIDs, { progress }),
        listOfUIDs
      );
    },
    downloadAndZipSeriesOnActiveViewport({ servers, viewports, progress }) {
      const dicomWebClient = getDicomWebClientFromContext(context, servers);
      const listOfUIDs = getSOPInstanceReferenceFromActiveViewport(viewports);
      return save(
        _downloadAndZip(dicomWebClient, listOfUIDs, { progress }),
        listOfUIDs
      );
    },
    downloadAndUploadStudy({ servers, studies, progress, serverConfig }) {
      const dicomWebClient = getDicomWebClientFromContext(context, servers);
      const listOfUIDs = getStudyInstanceUIDFromStudies(studies);
      return upload(
        downloadInstances(dicomWebClient, listOfUIDs, { progress }),
        /**
         * serverConfig is an object with the values used to create a new
         * instance of DICOMwebClient.
         *
         * Basic Structure:
         *
         * const config = {
         *    url,
         *    headers,
         *    errorInterceptor
         * }
         *
         * const dicomWeb = new api.DICOMwebClient(config);
         */
        serverConfig
      );
    },
  };

  const definitions = {
    downloadAndZip: {
      commandFn: queue.bindSafe(actions.downloadAndZip, error),
      storeContexts: ['servers'],
    },
    downloadAndZipStudy: {
      commandFn: queue.bindSafe(actions.downloadAndZipStudy, error),
      storeContexts: ['servers', 'studies'],
      options: { progress },
    },
    downloadAndZipSeriesOnViewports: {
      commandFn: queue.bindSafe(actions.downloadAndZipSeriesOnViewports, error),
      storeContexts: ['servers', 'viewports'],
      options: { progress },
    },
    downloadAndZipSeriesOnActiveViewport: {
      commandFn: queue.bindSafe(
        actions.downloadAndZipSeriesOnActiveViewport,
        error
      ),
      storeContexts: ['servers', 'viewports'],
      options: { progress },
    },
    downloadAndUploadStudy: {
      commandFn: queue.bindSafe(actions.downloadAndUploadStudy, error),
      storeContexts: ['servers', 'studies'],
      options: { progress },
    },
  };

  return {
    actions,
    definitions,
  };
}

/**
 * Utils
 */

function progress(status) {
  OHIF.log.info(
    'Download and Zip Progress:',
    (status.progress * 100.0).toFixed(2) + '%'
  );
}

function error(e) {
  if (e.message === 'Queue limit reached') {
    OHIF.log.warn('A download is already in progress, please wait.');
  } else {
    OHIF.log.error(e);
  }
}
