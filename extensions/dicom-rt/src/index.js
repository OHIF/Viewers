import React from 'react';
import init from './init.js';
import sopClassHandlerModule from './OHIFDicomRTStructSopClassHandler';
import id from './id.js';
import RTPanel from './components/RTPanel/RTPanel';
import { version } from '../package.json';

import { utils } from '@ohif/core';
const { studyMetadataManager } = utils;

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id,
  version,

  /**
   *
   *
   * @param {object} [configuration={}]
   * @param {object|array} [configuration.csToolsConfig] - Passed directly to `initCornerstoneTools`
   */
  preRegistration({ servicesManager, configuration = {} }) {
    init({ servicesManager, configuration });
  },
  getPanelModule({ commandsManager, servicesManager, api }) {
    const ExtendedRTPanel = props => {
      const { activeContexts } = api.hooks.useAppContext();

      const contourItemClickHandler = contourData => {
        commandsManager.runCommand('jumpToImage', contourData);
      };

      return (
        <RTPanel
          {...props}
          onContourItemClick={contourItemClickHandler}
          activeContexts={activeContexts}
          contexts={api.contexts}
        />
      );
    };

    return {
      menuOptions: [
        {
          icon: 'list',
          label: 'RTSTRUCT',
          target: 'rt-panel',
          isDisabled: (studies, activeViewport) => {
            if (!studies) {
              return true;
            }

            if (activeViewport) {
              const study = studies.find(
                s => s.StudyInstanceUID === activeViewport.StudyInstanceUID
              );
              const ds = study.displaySets.find(
                ds =>
                  ds.displaySetInstanceUID ===
                  activeViewport.displaySetInstanceUID
              );
              const studyMetadata = studyMetadataManager.get(
                activeViewport.StudyInstanceUID
              );
              const referencedDisplaySets = studyMetadata.getDerivedDatasets({
                referencedSeriesInstanceUID: activeViewport.SeriesInstanceUID,
                Modality: 'RTSTRUCT',
              });
              if (
                referencedDisplaySets &&
                referencedDisplaySets.some(ds =>
                  ['RTSTRUCT'].includes(ds.Modality)
                )
              ) {
                return false;
              }
            }

            return true;
          },
        },
      ],
      components: [
        {
          id: 'rt-panel',
          component: ExtendedRTPanel,
        },
      ],
      defaultContext: ['VIEWER'],
    };
  },
  getSopClassHandlerModule({ servicesManager }) {
    return sopClassHandlerModule;
  },
};
