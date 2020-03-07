import OHIF from '@ohif/core';
import {
  save,
  getDicomWebClientFromContext,
  getSOPInstanceReferenceFromActiveViewport,
  getSOPInstanceReferencesFromViewports,
} from './utils';
import downloadAndZip from './downloadAndZip';

export function getCommands(context) {
  const actions = {
    // Example for running this command using Commands Manager
    // commandsManager.runCommand(
    //   'downloadAndZip',
    //   {
    //     listOfUIDs: [...],
    //     options: {
    //       progress(status) {
    //         console.info('Progress:', (status.progress * 100).toFixed(2) + '%');
    //       }
    //     }
    //   },
    //   'VIEWER'
    // );
    downloadAndZip({ servers, dicomWebClient, listOfUIDs, options }) {
      return save(
        downloadAndZip(
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
        downloadAndZip(dicomWebClient, listOfUIDs, { progress }),
        listOfUIDs
      );
    },
    downloadAndZipSeriesOnActiveViewport({ servers, viewports, progress }) {
      const dicomWebClient = getDicomWebClientFromContext(context, servers);
      const listOfUIDs = getSOPInstanceReferenceFromActiveViewport(viewports);
      return save(
        downloadAndZip(dicomWebClient, listOfUIDs, { progress }),
        listOfUIDs
      );
    },
  };

  const definitions = {
    downloadAndZip: {
      commandFn: actions.downloadAndZip,
      storeContexts: ['servers'],
    },
    downloadAndZipSeriesOnViewports: {
      commandFn: actions.downloadAndZipSeriesOnViewports,
      storeContexts: ['servers', 'viewports'],
      options: { progress },
    },
    downloadAndZipSeriesOnActiveViewport: {
      commandFn: actions.downloadAndZipSeriesOnActiveViewport,
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
