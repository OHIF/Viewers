import React from 'react';
import { utils } from '@ohif/core';

import init from './init.js';
import sopClassHandlerModule from './OHIFDicomRTStructSopClassHandler';
import id from './id.js';
import RTPanel from './components/RTPanel/RTPanel';
import { version } from '../package.json';

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

    const RTPanelTabChangedEvent = 'rt-panel-tab-updated';

    /**
     * Trigger's an event to update the state of the panel's RoundedButtonGroup.
     *
     * This is required to avoid extension state
     * coupling with the viewer's ToolbarRow component.
     *
     * @param {object} data
     */
    const triggerRTPanelUpdatedEvent = data => {
      const event = new CustomEvent(RTPanelTabChangedEvent, {
        detail: data,
      });
      document.dispatchEvent(event);
    };

    const onRTStructsLoaded = ({ detail }) => {
      const { rtStructDisplaySet, referencedDisplaySet } = detail;

      const studyMetadata = studyMetadataManager.get(
        rtStructDisplaySet.StudyInstanceUID
      );
      const referencedDisplaysets = studyMetadata.getDerivedDatasets({
        referencedSeriesInstanceUID: referencedDisplaySet.SeriesInstanceUID,
        Modality: 'RTSTRUCT',
      });
      triggerRTPanelUpdatedEvent({
        badgeNumber: referencedDisplaysets.length,
        target: 'rt-panel',
      });
    };

    document.addEventListener('extensiondicomrtrtloaded', onRTStructsLoaded);

    return {
      menuOptions: [
        {
          icon: 'list',
          label: 'RTSTRUCT',
          target: 'rt-panel',
          stateEvent: RTPanelTabChangedEvent,
          isDisabled: (studies, activeViewport) => {
            if (!studies) {
              return true;
            }

            if (activeViewport) {
              const studyMetadata = studyMetadataManager.get(
                activeViewport.StudyInstanceUID
              );
              if (!studyMetadata) {
                return;
              }
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
                triggerRTPanelUpdatedEvent({
                  badgeNumber: referencedDisplaySets.length,
                  target: 'rt-panel',
                });
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
