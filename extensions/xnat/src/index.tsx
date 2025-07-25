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
import { version } from '../package.json';

// Export the study browser components
import XNATStudyBrowser from './xnat-components/XNATStudyBrowser/XNATStudyBrowser';
import XNATStudyItem from './xnat-components/XNATStudyBrowser/XNATStudyItem';
import XNATThumbnail from './xnat-components/XNATStudyBrowser/XNATThumbnail';

// Patch segmentation service to handle missing segment centers gracefully
const patchSegmentationService = (servicesManager) => {
  const { segmentationService } = servicesManager.services;
  if (segmentationService && segmentationService.jumpToSegmentCenter) {
    const originalJumpToSegmentCenter = segmentationService.jumpToSegmentCenter.bind(segmentationService);

    segmentationService.jumpToSegmentCenter = function (segmentationId, segmentIndex, ...args) {
      try {
        // Check if segment center data exists before attempting jump
        const segmentation = this.getSegmentation(segmentationId);
        if (segmentation && segmentation.segments && segmentation.segments[segmentIndex]) {
          const segment = segmentation.segments[segmentIndex];
          if (segment.cachedStats && (segment.cachedStats.center || segment.cachedStats.namedStats?.center?.value)) {
            return originalJumpToSegmentCenter(segmentationId, segmentIndex, ...args);
          } else {
            return;
          }
        }
      } catch (error) {
        console.warn('XNAT: Error in jumpToSegmentCenter, skipping:', error);
        return;
      }
    };
  }
};

const xnatExtension: Types.Extensions.Extension = {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: '@ohif/extension-xnat',
  preRegistration,
  onModeEnter: ({ servicesManager, extensionManager }) => {
    const { toolGroupService } = servicesManager.services;
    // Patch the segmentation service when entering a mode
    setTimeout(() => patchSegmentationService(servicesManager), 100);

    const toolGroup = toolGroupService.getToolGroup('default');

    if (toolGroup) {
      const utilityModule = extensionManager.getModuleEntry(
        '@ohif/extension-cornerstone.utilityModule.tools'
      );
      const { Enums } = utilityModule.exports;
      const measurementTools = [
        'Length',
        'Bidirectional',
        'EllipticalROI',
        'CircleROI',
        'RectangleROI',
        'ArrowAnnotate',
      ];

      measurementTools.forEach(toolName => {
        if (toolGroup.hasTool(toolName)) {
          toolGroup.setToolMode(toolName, Enums.ToolModes.Enabled);
        }
      });
    }
  },
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
