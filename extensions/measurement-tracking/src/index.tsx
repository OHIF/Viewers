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
    const { customizationService } = servicesManager.services;
    customizationService.setCustomizations({
      'studyBrowser.thumbnailDoubleClickCallback': {
        $set: onDoubleClickHandler,
      },
      customOnDropHandler: {
        $set: customOnDropHandlerCallback,
      },
    });
  },
  getCustomizationModule,
};

export default measurementTrackingExtension;

export { measurementTrackingMode };
