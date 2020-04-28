import OHIF from '@ohif/core';
import {
  save,
  getDicomWebClientFromContext,
  getSOPInstanceReferenceFromActiveViewport,
  getSOPInstanceReferencesFromViewports,
} from './utils';
import _downloadAndZip from './downloadAndZip';

const {
  utils: {
    Queue,
  },
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
  };

  const definitions = {
    downloadAndZip: {
      commandFn: queue.bindSafe(actions.downloadAndZip, error),
      storeContexts: ['servers'],
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
