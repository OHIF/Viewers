import React from 'react';
import init from './init.js';
import toolbarModule from './toolbarModule.js';
import getSopClassHandlerModule from './getOHIFDicomSegSopClassHandler.js';
import SegmentationPanel from './components/SegmentationPanel/SegmentationPanel.js';
import { version } from '../package.json';

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'com.ohif.dicom-segmentation',
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
  getToolbarModule({ servicesManager }) {
    return toolbarModule;
  },
  getPanelModule({ commandsManager, api, servicesManager }) {
    const { UINotificationService, LoggerService } = servicesManager.services;

    const ExtendedSegmentationPanel = props => {
      const { activeContexts } = api.hooks.useAppContext();

      const onDisplaySetLoadFailureHandler = error => {
        LoggerService.error({ error, message: error.message });
        UINotificationService.show({
          title: 'DICOM Segmentation Loader',
          message: error.message,
          type: 'error',
          autoClose: false,
        });
      };

      const segmentItemClickHandler = data => {
        commandsManager.runCommand('jumpToImage', data);
        commandsManager.runCommand('jumpToSlice', data);
      };

      const onSegmentVisibilityChangeHandler = (segmentNumber, visible) => {
        commandsManager.runCommand('setSegmentConfiguration', {
          segmentNumber,
          visible,
        });
      };

      const onConfigurationChangeHandler = configuration => {
        commandsManager.runCommand('setSegmentationConfiguration', {
          globalOpacity: configuration.fillAlpha,
          outlineThickness: configuration.outlineWidth,
          renderOutline: configuration.renderOutline,
          visible: configuration.renderFill,
        });
      };

      const onSelectedSegmentationChangeHandler = () => {
        commandsManager.runCommand('requestNewSegmentation');
      };

      return (
        <SegmentationPanel
          {...props}
          activeContexts={activeContexts}
          contexts={api.contexts}
          onSegmentItemClick={segmentItemClickHandler}
          onSegmentVisibilityChange={onSegmentVisibilityChangeHandler}
          onConfigurationChange={onConfigurationChangeHandler}
          onSelectedSegmentationChange={onSelectedSegmentationChangeHandler}
          onDisplaySetLoadFailure={onDisplaySetLoadFailureHandler}
        />
      );
    };

    return {
      menuOptions: [
        {
          icon: 'list',
          label: 'Segmentations',
          target: 'segmentation-panel',
          isDisabled: studies => {
            if (!studies) {
              return true;
            }

            for (let i = 0; i < studies.length; i++) {
              const study = studies[i];

              if (study && study.series) {
                for (let j = 0; j < study.series.length; j++) {
                  const series = study.series[j];

                  if (series.Modality === 'SEG') {
                    return false;
                  }
                }
              }
            }

            return true;
          },
        },
      ],
      components: [
        {
          id: 'segmentation-panel',
          component: ExtendedSegmentationPanel,
        },
      ],
      defaultContext: ['VIEWER'],
    };
  },
  getSopClassHandlerModule,
};
