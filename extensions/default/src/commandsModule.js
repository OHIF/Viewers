import DicomTagBrowser from './DicomTagBrowser/DicomTagBrowser';
import React from 'react';

const commandsModule = ({ servicesManager, commandsManager }) => {
  const {
    MeasurementService,
    HangingProtocolService,
    UINotificationService,
    ViewportGridService,
    DisplaySetService,
  } = servicesManager.services;

  const actions = {
    displayNotification: ({ text, title, type }) => {
      UINotificationService.show({
        title: title,
        message: text,
        type: type,
      });
    },
    clearMeasurements: () => {
      MeasurementService.clear();
    },
    nextStage: () => {
      // next stage in hanging protocols
      HangingProtocolService.nextProtocolStage();
    },
    previousStage: () => {
      HangingProtocolService.previousProtocolStage();
    },
    openDICOMTagViewer() {
      const { activeViewportIndex, viewports } = ViewportGridService.getState();
      const activeViewportSpecificData = viewports[activeViewportIndex];
      const { displaySetInstanceUIDs } = activeViewportSpecificData;

      const displaySets = DisplaySetService.activeDisplaySets;
      const { UIModalService } = servicesManager.services;

      const displaySetInstanceUID = displaySetInstanceUIDs[0];
      UIModalService.show({
        content: DicomTagBrowser,
        contentProps: {
          displaySets,
          displaySetInstanceUID,
          onClose: UIModalService.hide,
        },
        title: 'DICOM Tag Browser',
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
