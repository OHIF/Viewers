import React from 'react';

import getContextModule from './getContextModule';
import getPanelModule from './getPanelModule';
import getViewportModule from './getViewportModule';
import { id } from './id.js';
import { ViewportActionButton } from '@ohif/ui-next';
import i18n from '@ohif/i18n';
import { measurementTrackingMode } from './contexts/TrackedMeasurementsContext/promptBeginTracking';
import getCustomizationModule from './getCustomizationModule';
import {
  onDoubleClickHandler,
  customOnDropHandlerCallback,
} from './customizations/studyBrowserCustomization';

const measurementTrackingExtension = {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id,

  getContextModule,
  getPanelModule,
  getViewportModule,

  onModeEnter({ servicesManager }) {
    const { toolbarService, customizationService } = servicesManager.services;
    customizationService.setCustomizations({
      'studyBrowser.thumbnailDoubleClickCallback': {
        $set: onDoubleClickHandler,
      },
      customOnDropHandler: {
        $set: customOnDropHandlerCallback,
      },
    });
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
  getCustomizationModule,
};

export default measurementTrackingExtension;

export { measurementTrackingMode };
