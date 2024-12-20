import React from 'react';

import getContextModule from './getContextModule';
import getPanelModule from './getPanelModule';
import getViewportModule from './getViewportModule';
import { id } from './id.js';
import { ViewportActionButton } from '@ohif/ui';
import i18n from '@ohif/i18n';

const measurementTrackingExtension = {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id,

  getContextModule,
  getPanelModule,
  getViewportModule,

  onModeEnter({ servicesManager }) {
    const { toolbarService } = servicesManager.services;

    toolbarService.addButtons(
      [
        {
          // A button for loading tracked, SR measurements.
          // Note that the command run is registered in TrackedMeasurementsContext
          // because it must be bound to a React context's data.
          id: 'loadSRMeasurements',
          component: props => (
            <ViewportActionButton {...props}>{i18n.t('Common:LOAD')}</ViewportActionButton>
          ),
          props: {
            commands: ['loadTrackedSRMeasurements'],
          },
        },
      ],
      true // replace the button if it is already defined
    );
  },
};

export default measurementTrackingExtension;
