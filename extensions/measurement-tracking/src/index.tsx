import getContextModule from './getContextModule';
import getPanelModule from './getPanelModule';
import getViewportModule from './getViewportModule';
import { id } from './id.js';
import { measurementTrackingMode } from './contexts/TrackedMeasurementsContext/promptBeginTracking';
import getCustomizationModule from './getCustomizationModule';
import {
  onDoubleClickHandler,
  customOnDropHandlerCallback,
} from './customizations/studyBrowserCustomization';
import { TrackedMeasurementsService } from './services';
// Import types to ensure they're included in the build
import './types';

const measurementTrackingExtension = {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id,

  getContextModule,
  getPanelModule,
  getViewportModule,

  /**
   * Service configuration
   */
  preRegistration({ servicesManager }) {
    servicesManager.registerService(TrackedMeasurementsService.REGISTRATION);
  },

  onModeEnter({ servicesManager }) {
    const { customizationService, toolbarService, trackedMeasurementsService } =
      servicesManager.services;

    toolbarService.registerEventForToolbarUpdate(trackedMeasurementsService, [
      trackedMeasurementsService.EVENTS.TRACKED_SERIES_CHANGED,
      trackedMeasurementsService.EVENTS.SERIES_ADDED,
      trackedMeasurementsService.EVENTS.SERIES_REMOVED,
      trackedMeasurementsService.EVENTS.TRACKING_ENABLED,
      trackedMeasurementsService.EVENTS.TRACKING_DISABLED,
    ]);

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
