import { Types } from '@ohif/core';
import { createBasicCommands } from './commands/basicCommands';
import { createHangingProtocolCommands } from './commands/hangingProtocolCommands';
import { createViewportCommands } from './commands/viewportCommands';
import { createSegmentationCommands } from './commands/segmentationCommands';
import { createXNATCommands } from './commands/xnatCommands';
import { createMeasurementCommands } from './commands/measurementCommands';

export type HangingProtocolParams = {
  protocolId?: string;
  stageIndex?: number;
  activeStudyUID?: string;
  StudyInstanceUID?: string;
  stageId?: string;
  reset?: boolean;
};

export interface NavigateHistory {
  to: string;
  options?: {
    replace?: boolean;
  };
}

export type UpdateViewportDisplaySetParams = {
  direction: number;
  excludeNonImageModalities?: boolean;
};

const commandsModule = ({
  servicesManager,
  commandsManager,
  extensionManager,
}: Types.Extensions.ExtensionParams): Types.Extensions.CommandsModule => {
  // Import command modules
  const basicCommands = createBasicCommands(servicesManager, commandsManager, extensionManager);
  const hangingProtocolCommands = createHangingProtocolCommands(servicesManager, commandsManager);
  const viewportCommands = createViewportCommands(servicesManager, commandsManager);
  const segmentationCommands = createSegmentationCommands(servicesManager, commandsManager);
  const xnatCommands = createXNATCommands(servicesManager, commandsManager, extensionManager);
  const measurementCommands = createMeasurementCommands(servicesManager, commandsManager);

  // Combine all command actions
  const actions = {
    ...basicCommands,
    ...hangingProtocolCommands,
    ...viewportCommands,
    ...segmentationCommands,
    ...xnatCommands,
    ...measurementCommands,
  };

  // Define command definitions with proper options
  const definitions = {
    multimonitor: {
      commandFn: actions.multimonitor,
    },
    loadStudy: {
      commandFn: actions.loadStudy,
    },
    showContextMenu: {
      commandFn: actions.showContextMenu,
    },
    closeContextMenu: {
      commandFn: actions.closeContextMenu,
    },
    clearMeasurements: {
      commandFn: actions.clearMeasurements,
    },
    displayNotification: {
      commandFn: actions.displayNotification,
    },
    setHangingProtocol: {
      commandFn: actions.setHangingProtocol,
    },
    toggleHangingProtocol: {
      commandFn: actions.toggleHangingProtocol,
    },
    navigateHistory: {
      commandFn: actions.navigateHistory,
    },
    nextStage: {
      commandFn: actions.deltaStage,
      options: { direction: 1 },
    },
    previousStage: {
      commandFn: actions.deltaStage,
      options: { direction: -1 },
    },
    setViewportGridLayout: {
      commandFn: actions.setViewportGridLayout,
    },
    toggleOneUp: {
      commandFn: actions.toggleOneUp,
    },
    openDICOMTagViewer: {
      commandFn: actions.openDICOMTagViewer,
    },
    updateViewportDisplaySet: {
      commandFn: actions.updateViewportDisplaySet,
    },
    loadSegmentationsForViewport: {
      commandFn: actions.loadSegmentationsForViewport,
    },
    generateSegmentation: {
      commandFn: actions.generateSegmentation,
    },
    downloadSegmentation: {
      commandFn: actions.downloadSegmentation,
    },
    storeSegmentation: {
      commandFn: actions.XNATStoreSegmentation,
    },
    downloadRTSS: {
      commandFn: actions.downloadRTSS,
    },
    setBrushSize: {
      commandFn: actions.setBrushSize,
    },
    setThresholdRange: {
      commandFn: actions.setThresholdRange,
    },
    increaseBrushSize: {
      commandFn: actions.increaseBrushSize,
    },
    decreaseBrushSize: {
      commandFn: actions.decreaseBrushSize,
    },
    addNewSegment: {
      commandFn: actions.addNewSegment,
    },
    xnatRunSegmentBidirectional: {
      commandFn: actions.xnatRunSegmentBidirectional,
    },
    setActiveSegmentAndCenter: {
      commandFn: actions.setActiveSegmentAndCenter,
    },
    XNATImportSegmentation: {
      commandFn: actions.XNATImportSegmentation,
    },
    XNATExportSegmentation: {
      commandFn: actions.XNATStoreSegmentation,
    },
    downloadCSVSegmentationReport: {
      commandFn: actions.downloadCSVSegmentationReport,
    },
    XNATPromptSaveReport: {
      commandFn: actions.XNATPromptSaveReport,
      storeContexts: [],
      options: {},
    },
    XNATStoreReport: {
      commandFn: actions.XNATStoreReport,
      storeContexts: [],
      options: {},
    },
    XNATImportMeasurements: {
      commandFn: actions.XNATImportMeasurements,
    },
    XNATStoreMeasurements: {
      commandFn: actions.XNATStoreMeasurements,
      storeContexts: [],
      options: {},
    },
    XNATMeasurementApi: {
      commandFn: actions.XNATMeasurementApi,
    },
    XNATCustomFormsApi: {
      commandFn: actions.XNATCustomFormsApi,
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'DEFAULT',
  };
};

export default commandsModule;
