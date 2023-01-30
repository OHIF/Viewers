import React from 'react';
import ConnectedMeasurementTable from './ConnectedMeasurementTable.js';
import init from './init.js';
import OHIF from '@ohif/core';

import LabellingFlow from '../../components/Labelling/LabellingFlow';

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'measurements-table',
  get version() {
    return window.version;
  },

  preRegistration({ servicesManager, commandsManager, configuration = {} }) {
    init({ servicesManager, commandsManager, configuration });
  },

  getPanelModule({ servicesManager, commandsManager }) {
    const { UINotificationService, UIDialogService } = servicesManager.services;

    const showLabellingDialog = (props, measurementData) => {
      if (!UIDialogService) {
        console.warn('Unable to show dialog; no UI Dialog Service available.');
        return;
      }

      UIDialogService.dismiss({ id: 'labelling' });
      UIDialogService.create({
        id: 'labelling',
        centralize: true,
        isDraggable: false,
        showOverlay: true,
        content: LabellingFlow,
        contentProps: {
          measurementData,
          labellingDoneCallback: () =>
            UIDialogService.dismiss({ id: 'labelling' }),
          updateLabelling: ({ location, description, response }) => {
            measurementData.location = location || measurementData.location;
            measurementData.description = description || '';
            measurementData.response = response || measurementData.response;

            commandsManager.runCommand(
              'updateTableWithNewMeasurementData',
              measurementData
            );
          },
          ...props,
        },
      });
    };

    const ExtendedConnectedMeasurementTable = () => (
      <ConnectedMeasurementTable
        onRelabel={tool =>
          showLabellingDialog(
            { editLocation: true, skipAddLabelButton: true },
            tool
          )
        }
        onEditDescription={tool =>
          showLabellingDialog({ editDescriptionOnDialog: true }, tool)
        }
        onSaveComplete={message => {
          if (UINotificationService) {
            UINotificationService.show(message);
          }
        }}
      />
    );

    const MeasurementTabUpdatedEvent = 'measurement-panel-tab-updated';

    const updateMeasurementPanel = data => {
      const event = new CustomEvent(MeasurementTabUpdatedEvent, {
        detail: data,
      });
      document.dispatchEvent(event);
    };

    const onMeasurementsFound = ({ detail }) => {
      const { srWithMeasurements } = detail;
      updateMeasurementPanel({
        badgeNumber: srWithMeasurements,
        target: 'measurement-panel',
      });
    };

    document.addEventListener('foundSRDisplaySets', onMeasurementsFound);

    return {
      menuOptions: [
        {
          icon: 'list',
          label: 'Measurements',
          target: 'measurement-panel',
          stateEvent: MeasurementTabUpdatedEvent,
          isDisabled: (studies, activeViewport) => {
            if (!studies) {
              return true;
            }

            for (let i = 0; i < studies.length; i++) {
              const study = studies[i];
              if (study && study.series) {
                for (let j = 0; j < study.series.length; j++) {
                  const series = study.series[j];

                  if (series.Modality === 'SR') {
                    if (activeViewport) {
                      const { SRLabels } = activeViewport;
                      if (SRLabels && SRLabels.length > 0) {
                        let srWithMeasurements = 1;
                        let prevUID = SRLabels[0].SeriesInstanceUID;

                        SRLabels.forEach(SRLabel => {
                          const currUID = SRLabel.SeriesInstanceUID;
                          if (currUID !== prevUID) {
                            srWithMeasurements = srWithMeasurements + 1;
                            prevUID = currUID;
                          }
                        });

                        updateMeasurementPanel({
                          badgeNumber: srWithMeasurements,
                          target: 'measurement-panel',
                        });
                      }
                    }
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
          id: 'measurement-panel',
          component: ExtendedConnectedMeasurementTable,
        },
      ],
      defaultContext: ['VIEWER'],
    };
  },
};
