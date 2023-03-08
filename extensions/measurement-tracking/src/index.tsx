import { Types } from '@ohif/core';
import getContextModule from './getContextModule';
import getPanelModule, { addActivatePanelTriggers } from './getPanelModule';
import getViewportModule from './getViewportModule';
import { id } from './id.js';

let _activatePanelTriggersSubscriptions: Types.Subscription[] = [];

const measurementTrackingExtension = {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id,

  getContextModule,
  getPanelModule,
  getViewportModule,
  onModeEnter({ servicesManager }) {
    _activatePanelTriggersSubscriptions = addActivatePanelTriggers(
      servicesManager
    );
  },
  onModeExit() {
    _activatePanelTriggersSubscriptions.forEach(sub => sub.unsubscribe());
    _activatePanelTriggersSubscriptions = [];
  },
};

export default measurementTrackingExtension;
