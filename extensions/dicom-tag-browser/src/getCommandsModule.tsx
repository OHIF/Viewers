import { utils } from '@ohif/core';
import React from 'react';
import DicomTagBrowser from './components/DicomTagBrowser';
import { useParams, useLocation } from 'react-router';


//import { useQuery } from '@hooks';

const { studyMetadataManager } = utils;

export default function getCommandsModule(servicesManager) {
  const {
    ViewportGridService,
    DisplaySetService
  } = servicesManager.services;

  //const query = useQuery();
  const actions = {
    openDICOMTagViewer() {
      //  const StudyInstanceUID = query.get('StudyInstanceUIDs');
      const { activeViewportIndex, viewports } = ViewportGridService.getState();
      const activeViewportSpecificData =
        viewports[activeViewportIndex];
      const {
        displaySetInstanceUIDs,
      } = activeViewportSpecificData;

      //const studyMetadata = studyMetadataManager.get(StudyInstanceUID);
      const displaySets = DisplaySetService.activeDisplaySets;
      const { UIModalService } = servicesManager.services;

      const WrappedDicomTagBrowser = function () {
        return (
          <DicomTagBrowser
            displaySets={displaySets}
            displaySetInstanceUID={displaySetInstanceUIDs}
          />
        );
      };
      const displaySetInstanceUID = displaySetInstanceUIDs[0]
      UIModalService.show({
        content: DicomTagBrowser,
        contentProps: {
          displaySets,
          displaySetInstanceUID,
          onClose: UIModalService.hide,
        },
        title: 'DICOM Tag Browser'
      });
    },
  };

  const definitions = {
    openDICOMTagViewer: {
      commandFn: actions.openDICOMTagViewer,
      // storeContexts: ['servers', 'viewports'],
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'TAGBROWSER',
  };
}
