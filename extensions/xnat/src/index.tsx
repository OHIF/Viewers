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
import preRegistration from './init';
import getLayoutTemplateModule from './getLayoutTemplateModule';

import { useViewportsByPositionStore } from './stores/useViewportsByPositionStore';
import { useViewportGridStore } from './stores/useViewportGridStore';
import { useUIStateStore } from './stores/useUIStateStore';
import { useDisplaySetSelectorStore } from './stores/useDisplaySetSelectorStore';
import { useHangingProtocolStageIndexStore } from './stores/useHangingProtocolStageIndexStore';
import { useToggleHangingProtocolStore } from './stores/useToggleHangingProtocolStore';
import ViewportGrid from '@ohif/ui/src/components/ViewportGrid';

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
  getViewportModule,
  getPanelModule,
  getHangingProtocolModule,
  getToolbarModule,
  getCommandsModule,
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

  getLayoutTemplateModule() {
    return [
      {
        id: 'xnat-basic-layout',
        name: 'XNAT Basic Viewport',
        component: ViewportGrid
      }
    ];
  }
};

export { isLoggedIn, xnatAuthenticate } from './utils/xnatDev.js';

export { userManagement } from './utils/userManagement.js';

export {
  DATA_IMPORT_STATUS,
  ROI_COLOR_TEMPLATES,
  colorTools,
} from './utils/index.js';

export { sessionMap, fetchCSRFToken };
export default xnatExtension;
