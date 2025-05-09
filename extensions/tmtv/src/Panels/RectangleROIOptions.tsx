import React, { useCallback, useReducer } from 'react';
import { Button } from '@ohif/ui-next';
import ROIThresholdConfiguration, {
  ROI_STAT,
} from './PanelROIThresholdSegmentation/ROIThresholdConfiguration';
import * as cs3dTools from '@cornerstonejs/tools';
import { useSystem } from '@ohif/core';
import { useSegmentations } from '@ohif/extension-cornerstone';

const LOWER_CT_THRESHOLD_DEFAULT = -1024;
const UPPER_CT_THRESHOLD_DEFAULT = 1024;
const LOWER_PT_THRESHOLD_DEFAULT = 2.5;
const UPPER_PT_THRESHOLD_DEFAULT = 100;
const WEIGHT_DEFAULT = 0.41; // a default weight for suv max often used in the literature
const DEFAULT_STRATEGY = ROI_STAT;

function reducer(state, action) {
  const { payload } = action;
  const { strategy, ctLower, ctUpper, ptLower, ptUpper, weight } = payload;

  switch (action.type) {
    case 'setStrategy':
      return {
        ...state,
        strategy,
      };
    case 'setThreshold':
      return {
        ...state,
        ctLower: ctLower ? ctLower : state.ctLower,
        ctUpper: ctUpper ? ctUpper : state.ctUpper,
        ptLower: ptLower ? ptLower : state.ptLower,
        ptUpper: ptUpper ? ptUpper : state.ptUpper,
      };
    case 'setWeight':
      return {
        ...state,
        weight,
      };
    default:
      return state;
  }
}

function RectangleROIOptions() {
  const { commandsManager } = useSystem();
  const segmentations = useSegmentations();
  const activeSegmentation = segmentations[0];

  const runCommand = useCallback(
    (commandName, commandOptions = {}) => {
      return commandsManager.runCommand(commandName, commandOptions);
    },
    [commandsManager]
  );

  const [config, dispatch] = useReducer(reducer, {
    strategy: DEFAULT_STRATEGY,
    ctLower: LOWER_CT_THRESHOLD_DEFAULT,
    ctUpper: UPPER_CT_THRESHOLD_DEFAULT,
    ptLower: LOWER_PT_THRESHOLD_DEFAULT,
    ptUpper: UPPER_PT_THRESHOLD_DEFAULT,
    weight: WEIGHT_DEFAULT,
  });

  const handleROIThresholding = useCallback(() => {
    if (!activeSegmentation) {
      return;
    }

    const segmentationId = activeSegmentation.segmentationId;
    const activeSegmentIndex =
      cs3dTools.segmentation.segmentIndex.getActiveSegmentIndex(segmentationId);

    runCommand('thresholdSegmentationByRectangleROITool', {
      segmentationId,
      config,
      segmentIndex: activeSegmentIndex,
    });
  }, [activeSegmentation, config]);

  return (
    <div className="invisible-scrollbar mb-1 flex flex-col overflow-y-auto overflow-x-hidden">
      <ROIThresholdConfiguration
        config={config}
        dispatch={dispatch}
        runCommand={runCommand}
      />
      {activeSegmentation && (
        <Button
          variant="default"
          className="my-3 mr-auto w-20"
          onClick={handleROIThresholding}
        >
          Run
        </Button>
      )}
    </div>
  );
}

export default RectangleROIOptions;
