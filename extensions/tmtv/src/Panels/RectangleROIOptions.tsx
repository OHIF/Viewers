import React, { useState, useCallback, useReducer, useEffect } from 'react';
import { Button } from '@ohif/ui';
import ROIThresholdConfiguration, {
  ROI_STAT,
} from './PanelROIThresholdSegmentation/ROIThresholdConfiguration';
import * as cs3dTools from '@cornerstonejs/tools';

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

function RectangleROIOptions({ servicesManager, commandsManager }) {
  const { segmentationService } = servicesManager.services;
  const [selectedSegmentationId, setSelectedSegmentationId] = useState(null);

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
    const segmentationId = selectedSegmentationId;

    const segmentation = segmentationService.getSegmentation(segmentationId);
    const activeSegmentIndex =
      cs3dTools.segmentation.segmentIndex.getActiveSegmentIndex(segmentationId);

    // run the threshold based on the active segment index
    // Todo: later find a way to associate each rectangle with a segment (e.g., maybe with color?)
    const labelmap = runCommand('thresholdSegmentationByRectangleROITool', {
      segmentationId,
      config,
      segmentIndex: activeSegmentIndex,
    });

    // re-calculating the cached stats for the active segmentation
    const updatedPerSegmentCachedStats = {};
    segmentation.segments = segmentation.segments.map(segment => {
      if (!segment || !segment.segmentIndex) {
        return segment;
      }

      const segmentIndex = segment.segmentIndex;

      const lesionStats = runCommand('getLesionStats', { labelmap, segmentIndex });
      const suvPeak = runCommand('calculateSuvPeak', { labelmap, segmentIndex });
      const lesionGlyoclysisStats = lesionStats.volume * lesionStats.meanValue;

      // update segDetails with the suv peak for the active segmentation
      const cachedStats = {
        lesionStats,
        suvPeak,
        lesionGlyoclysisStats,
      };

      segment.cachedStats = cachedStats;
      segment.displayText = [
        `SUV Peak: ${suvPeak.suvPeak.toFixed(2)}`,
        `Volume: ${lesionStats.volume.toFixed(2)} mm3`,
      ];
      updatedPerSegmentCachedStats[segmentIndex] = cachedStats;

      return segment;
    });

    const notYetUpdatedAtSource = true;

    const segmentations = segmentationService.getSegmentations();
    const tmtv = runCommand('calculateTMTV', { segmentations });

    segmentation.cachedStats = Object.assign(
      segmentation.cachedStats,
      updatedPerSegmentCachedStats,
      {
        tmtv: {
          value: tmtv.toFixed(3),
          config: { ...config },
        },
      }
    );

    segmentationService.addOrUpdateSegmentation(
      {
        ...segmentation,
      },
      false, // don't suppress events
      notYetUpdatedAtSource
    );
  }, [selectedSegmentationId, config]);

  useEffect(() => {
    const segmentations = segmentationService.getSegmentations();

    if (!segmentations.length) {
      return;
    }

    const isActive = segmentations.find(seg => seg.isActive);
    setSelectedSegmentationId(isActive.id);
  }, []);

  /**
   * Update UI based on segmentation changes (added, removed, updated)
   */
  useEffect(() => {
    // ~~ Subscription
    const added = segmentationService.EVENTS.SEGMENTATION_ADDED;
    const updated = segmentationService.EVENTS.SEGMENTATION_UPDATED;
    const subscriptions = [];

    [added, updated].forEach(evt => {
      const { unsubscribe } = segmentationService.subscribe(evt, () => {
        const segmentations = segmentationService.getSegmentations();

        if (!segmentations.length) {
          return;
        }

        const isActive = segmentations.find(seg => seg.isActive);
        setSelectedSegmentationId(isActive.id);
      });
      subscriptions.push(unsubscribe);
    });

    return () => {
      subscriptions.forEach(unsub => {
        unsub();
      });
    };
  }, []);

  useEffect(() => {
    const { unsubscribe } = segmentationService.subscribe(
      segmentationService.EVENTS.SEGMENTATION_REMOVED,
      () => {
        const segmentations = segmentationService.getSegmentations();

        if (segmentations.length > 0) {
          setSelectedSegmentationId(segmentations[0].id);
          handleROIThresholding();
        } else {
          setSelectedSegmentationId(null);
          handleROIThresholding();
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="invisible-scrollbar mb-2 flex flex-col overflow-y-auto overflow-x-hidden">
      <ROIThresholdConfiguration
        config={config}
        dispatch={dispatch}
        runCommand={runCommand}
      />
      {selectedSegmentationId !== null && (
        <Button
          className="mt-2 !h-[26px] !w-[75px]"
          onClick={handleROIThresholding}
        >
          Run
        </Button>
      )}
    </div>
  );
}

export default RectangleROIOptions;
