import { Types } from '@ohif/core';
import { id } from './id';
import sessionMap from './utils/sessionMap.js';
import { fetchCSRFToken } from './utils/index.js';
import getDataSourcesModule from './getDataSourcesModule';
import getPanelModule from './getPanelModule';
import getToolbarModule from './getToolbarModule';
import getCommandsModule from './commandsModule';
import getHangingProtocolModule from './getHangingProtocolModule';
import getStudiesForPatientByMRN from './Panels/getStudiesForPatientByMRN';
import getCustomizationModule from './getCustomizationModule';
import getViewportModule from './getViewportModule';
import { preRegistration } from './init';
import getLayoutTemplateModule from './getLayoutTemplateModule';
import getSopClassHandlerModule from './getSopClassHandlerModule';
import { useViewportsByPositionStore } from './stores/useViewportsByPositionStore';
import { useViewportGridStore } from './stores/useViewportGridStore';
import { useUIStateStore } from './stores/useUIStateStore';
import { useDisplaySetSelectorStore } from './stores/useDisplaySetSelectorStore';
import { useHangingProtocolStageIndexStore } from './stores/useHangingProtocolStageIndexStore';
import { useToggleHangingProtocolStore } from './stores/useToggleHangingProtocolStore';

// Export the study browser components
import XNATStudyBrowser from './xnat-components/XNATStudyBrowser/XNATStudyBrowser';
import XNATStudyItem from './xnat-components/XNATStudyBrowser/XNATStudyItem';
import XNATThumbnail from './xnat-components/XNATStudyBrowser/XNATThumbnail';

const xnatExtension: Types.Extensions.Extension = {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: '@ohif/extension-xnat',
  preRegistration,
  onModeExit() {
    useViewportGridStore.getState().clearViewportGridState();
    useUIStateStore.getState().clearUIState();
    useDisplaySetSelectorStore.getState().clearDisplaySetSelectorMap();
    useHangingProtocolStageIndexStore.getState().clearHangingProtocolStageIndexMap();
    useToggleHangingProtocolStore.getState().clearToggleHangingProtocol();
    useViewportsByPositionStore.getState().clearViewportsByPosition();
  },
  getDataSourcesModule,
  getSopClassHandlerModule,
  getViewportModule,
  getPanelModule,
  getHangingProtocolModule,
  getToolbarModule,
  getCommandsModule,
  getLayoutTemplateModule,
  getUtilityModule({ servicesManager }) {
    return [
      {
        name: 'common',
        exports: {
          getStudiesForPatientByMRN,
        },
      },
    ];
  },
  getCustomizationModule,
};

export { isLoggedIn, xnatAuthenticate } from './utils/xnatDev.js';

export { userManagement } from './utils/userManagement.js';

export {
  DATA_IMPORT_STATUS,
  ROI_COLOR_TEMPLATES,
  colorTools,
} from './utils/index.js';

export { sessionMap, fetchCSRFToken };

// Export the study browser components
export { XNATStudyBrowser, XNATStudyItem, XNATThumbnail };

export default xnatExtension;
