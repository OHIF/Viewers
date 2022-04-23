import OHIF from '@ohif/core';
import UploadInstancesModal from './UploadInstancesModal';
import React from 'react';
import { getDicomWebClientFromContext } from './utils';

const {
  utils: { Queue },
} = OHIF;

export function getCommands(context, servicesManager, extensionManager) {
  const queue = new Queue(1);
  const { UIModalService } = servicesManager.services;
  const actions = {
    uploadInstancesOnActiveViewport({ servers, viewports, progress }) {
      const dicomWebClient = getDicomWebClientFromContext(context, servers);

      const { activeViewportIndex, viewportSpecificData } = viewports;
      const activeViewportSpecificData =
        viewportSpecificData[activeViewportIndex];

      const { StudyInstanceUID } = activeViewportSpecificData;

      const WrappedUploadInstancesModal = function() {
        return (
          <UploadInstancesModal
            dicomWebClient={dicomWebClient}
            StudyInstanceUID={StudyInstanceUID}
            onClose={UIModalService.hide}
          />
        );
      };

      UIModalService.show({
        content: WrappedUploadInstancesModal,
        title: `Upload Instances`,
        fullscreen: false,
        noScroll: true,
        shouldCloseOnEsc: false,
        closeButton: false,
      });
    },
  };

  const definitions = {
    uploadInstancesOnActiveViewport: {
      commandFn: queue.bindSafe(actions.uploadInstancesOnActiveViewport, e =>
        error(e)
      ),
      storeContexts: ['servers', 'viewports'],
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

function error(e) {
  if (e.message === 'Queue limit reached') {
    OHIF.log.warn('An upload is already in progress, please wait.');
  } else {
    OHIF.log.error(e);
  }
}
