import checkAndSetPermissions from './utils/checkAndSetPermissions';
import sessionMap from './utils/sessionMap.js';
import csTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';
import onKeyDownEvent from './utils/onKeyDownEvent';
import KEY_COMMANDS from './utils/keyCommands';
import queryAiaaSettings from './utils/IO/queryAiaaSettings';

const refreshCornerstoneViewports = () => {
  cornerstone.getEnabledElements().forEach(enabledElement => {
    if (enabledElement.image) {
      cornerstone.updateImage(enabledElement.element);
    }
  });
};

const getEnabledElement = activeIndex => {
  const enabledElements = cornerstone.getEnabledElements();
  return enabledElements[activeIndex].element;
};

// "actions" doesn't really mean anything
// these are basically ambiguous sets of implementation(s)
const actions = {
  brushUndoRedo: ({ viewports, operation }) => {
    const enabledElement = getEnabledElement(viewports.activeViewportIndex);
    if (!enabledElement) {
      return;
    }

    const segmentationModule = csTools.getModule('segmentation');

    const activeLabelmapIndex = segmentationModule.getters.activeLabelmapIndex(
      enabledElement
    );
    if (activeLabelmapIndex === undefined) {
      return;
    }

    let imageIdIndices = [];
    const { undo, redo, labelmaps2D } = segmentationModule.getters.labelmap3D(
      enabledElement
    );
    if (operation === 'undo' && undo.length) {
      undo[undo.length - 1].forEach(item =>
        imageIdIndices.push(item.imageIdIndex)
      );
      segmentationModule.setters.undo(enabledElement);
    } else if (operation === 'redo' && redo.length) {
      redo[redo.length - 1].forEach(item =>
        imageIdIndices.push(item.imageIdIndex)
      );
      segmentationModule.setters.redo(enabledElement);
    }

    // Update segments on Labelmap2D
    imageIdIndices.forEach(imageIndex => {
      segmentationModule.setters.updateSegmentsOnLabelmap2D(
        labelmaps2D[imageIndex]
      );
    });

    refreshCornerstoneViewports();
  },
};

const definitions = {
  xnatSetRootUrl: {
    commandFn: ({ url }) => {
      sessionMap.xnatRootUrl = url;
    },
    storeContexts: [],
    options: { url: null },
  },
  xnatSetView: {
    commandFn: ({ view }) => {
      sessionMap.setView(view);

      // console.log(sessionMap);
    },
    storeContexts: [],
    options: { view: null },
  },
  xnatSetSession: {
    commandFn: ({ json, sessionVariables }) => {
      sessionMap.setSession(json, sessionVariables);

      // console.log(sessionMap);
    },
    storeContexts: [],
    options: { json: null, sessionVariables: null },
  },
  xnatGetExperimentID: {
    commandFn: ({ SeriesInstanceUID }) => {
      return sessionMap.getExperimentID(SeriesInstanceUID);
    },
    storeContexts: [],
    options: { SeriesInstanceUID: null },
  },
  xnatCheckAndSetPermissions: {
    commandFn: checkAndSetPermissions,
    storeContexts: [],
    options: { projectId: null, parentProjectId: null },
  },
  xnatRemoveToolState: {
    commandFn: ({ element, toolType, tool }) => {
      const freehand3DModule = csTools.store.modules.freehand3D;
      const strctureSet = freehand3DModule.getters.structureSet(
        tool.seriesInstanceUid,
        tool.structureSetUid
      );

      if (strctureSet.isLocked) {
        console.log('Cannot be deleted: member of a locked structure set');
        return;
      }

      csTools.removeToolState(element, toolType, tool);
      refreshCornerstoneViewports();
    },
    storeContexts: [],
    options: { element: null, toolType: null, tool: null },
  },
  xnatCancelROIDrawing: {
    commandFn: ({ evt }) => {
      // const syntheticEventData = getKeyPressData(evt);
      onKeyDownEvent(KEY_COMMANDS.FREEHANDROI_CANCEL_DRAWING);
    },
    storeContexts: [],
    options: { evt: null },
  },
  xnatCompleteROIDrawing: {
    commandFn: ({ evt }) => {
      onKeyDownEvent(KEY_COMMANDS.FREEHANDROI_COMPLETE_DRAWING);
    },
    storeContexts: [],
    options: { evt: null },
  },
  xnatIncreaseBrushSize: {
    commandFn: ({ evt }) => {
      onKeyDownEvent(KEY_COMMANDS.BRUSHTOOL_INCREASE_SIZE);
    },
    storeContexts: [],
    options: { evt: null },
  },
  xnatDecreaseBrushSize: {
    commandFn: ({ evt }) => {
      onKeyDownEvent(KEY_COMMANDS.BRUSHTOOL_DECREASE_SIZE);
    },
    storeContexts: [],
    options: { evt: null },
  },
  xnatCheckAndSetAiaaSettings: {
    commandFn: queryAiaaSettings,
    storeContexts: [],
    options: { projectId: null },
  },
  xnatBrushUndo: {
    commandFn: actions.brushUndoRedo,
    storeContexts: ['viewports'],
    options: { operation: 'undo' },
  },
  xnatBrushRedo: {
    commandFn: actions.brushUndoRedo,
    storeContexts: ['viewports'],
    options: { operation: 'redo' },
  },
};

export default {
  actions,
  definitions,
  defaultContext: 'VIEWER',
};
