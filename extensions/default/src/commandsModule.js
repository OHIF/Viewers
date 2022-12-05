import DicomTagBrowser from './DicomTagBrowser/DicomTagBrowser';
import React from 'react';

const commandsModule = ({ servicesManager, commandsManager }) => {
  const {
    measurementService,
    hangingProtocolService,
    uiNotificationService,
    viewportGridService,
    displaySetService,
  } = servicesManager.services;

  const actions = {
    displayNotification: ({ text, title, type }) => {
      uiNotificationService.show({
        title: title,
        message: text,
        type: type,
      });
    },
    clearMeasurements: () => {
      measurementService.clear();
    },
    nextStage: () => {
      // next stage in hanging protocols
      hangingProtocolService.nextProtocolStage();
    },
    previousStage: () => {
      hangingProtocolService.previousProtocolStage();
    },
    openDICOMTagViewer() {
      const { activeViewportIndex, viewports } = viewportGridService.getState();
      const activeViewportSpecificData = viewports[activeViewportIndex];
      const { displaySetInstanceUIDs } = activeViewportSpecificData;

      const displaySets = displaySetService.activeDisplaySets;
      const { uiModalService } = servicesManager.services;

      const displaySetInstanceUID = displaySetInstanceUIDs[0];
      uiModalService.show({
        content: DicomTagBrowser,
        contentProps: {
          displaySets,
          displaySetInstanceUID,
          onClose: uiModalService.hide,
        },
        title: 'DICOM Tag Browser',
      });
    },
    toggleOverlays: () => {
      const overlays = document.getElementsByClassName('viewport-overlay');
      let onoff = false; // true if this will toggle on
      for (let i = 0; i < overlays.length; i++) {
        if (i === 0) onoff = overlays.item(0).classList.contains('hidden');
        overlays.item(i).classList.toggle('hidden');
      }
      UINotificationService.show({
        title: 'Overlays Toggle',
        message: 'Overlays are toggled ' + (onoff ? 'on' : 'off'),
        type: 'success',
      });
    },
  };

  const definitions = {
    clearMeasurements: {
      commandFn: actions.clearMeasurements,
      storeContexts: [],
      options: {},
    },
    displayNotification: {
      commandFn: actions.displayNotification,
      storeContexts: [],
      options: {},
    },
    nextStage: {
      commandFn: actions.nextStage,
      storeContexts: [],
      options: {},
    },
    previousStage: {
      commandFn: actions.previousStage,
      storeContexts: [],
      options: {},
    },
    openDICOMTagViewer: {
      commandFn: actions.openDICOMTagViewer,
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'DEFAULT',
  };
};

export default commandsModule;
