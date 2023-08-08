import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useReducer,
  ReactElement,
} from 'react';
import PropTypes from 'prop-types';

import { CommandsManager, ServicesManager } from '@ohif/core';
import { SegmentationTable, Button } from '@ohif/ui';
import { useTranslation } from 'react-i18next';
import BrushConfigurationWithServices from './BrushConfigurationWithServices';
import segmentationEditHandler from './segmentationEditHandler';
// import ExportReports from './ExportReports';
import RectangleROIThresholdConfiguration, {
  ROI_STAT,
} from './RectangleROIThresholdConfiguration';

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

function getToolsConfigInfo({ servicesManager, config, dispatch, runCommand }) {
  const wrappedBrushConfigurationWithServices = () => (
    <BrushConfigurationWithServices servicesManager={servicesManager} />
  );

  return {
    CircularBrush: {
      title: 'Circular Brush Configuration',
      component: wrappedBrushConfigurationWithServices,
    },
    CircularEraser: {
      title: 'Circular Eraser Configuration',
      component: wrappedBrushConfigurationWithServices,
    },
    SphereBrush: {
      title: 'Sphere Brush Configuration',
      component: wrappedBrushConfigurationWithServices,
    },
    SphereEraser: {
      title: 'Sphere Eraser Configuration',
      component: wrappedBrushConfigurationWithServices,
    },
    ThresholdBrush: {
      title: 'Threshold Brush Configuration',
      component: () => (
        <BrushConfigurationWithServices
          servicesManager={servicesManager}
          showThresholdSettings={true}
        />
      ),
    },
    RectangleROIStartEndThreshold: {
      title: 'ROI Threshold Configuration',
      component: () => (
        <RectangleROIThresholdConfiguration
          showStartEndThresholdSettings={true}
          config={config}
          dispatch={dispatch}
          runCommand={runCommand}
        />
      ),
    },
    RectangleROIThreshold: {
      title: 'ROI Threshold Configuration',
      component: () => (
        <RectangleROIThresholdConfiguration
          config={config}
          dispatch={dispatch}
          runCommand={runCommand}
        />
      ),
    },
  };
}

export default function ROISegmentationPanel({
  servicesManager,
  commandsManager,
}: {
  servicesManager: ServicesManager;
  commandsManager: CommandsManager;
}): ReactElement {
  const { toolGroupService, segmentationService } = servicesManager.services;
  const [activePrimaryTool, setActivePrimaryTool] = useState(
    toolGroupService.getActivePrimaryMouseButtonTool()
  );
  const { t } = useTranslation('PanelSUV');
  const [showConfig, setShowConfig] = useState(false);
  const [labelmapLoading, setLabelmapLoading] = useState(false);
  const [segmentations, setSegmentations] = useState(() =>
    segmentationService.getSegmentations()
  );
  const selectedSegmentationId = useMemo(
    () => segmentations.find(segmentation => segmentation.isActive)?.id,
    [segmentations]
  );
  const [nextSegmentationSequenceId, setNextSegmentationSequenceId] = useState(
    segmentations.length + 1
  );
  const showThresholdRunButton = [
    'RectangleROIThreshold',
    'RectangleROIStartEndThreshold',
  ].includes(activePrimaryTool);

  const [config, dispatch] = useReducer(reducer, {
    strategy: DEFAULT_STRATEGY,
    ctLower: LOWER_CT_THRESHOLD_DEFAULT,
    ctUpper: UPPER_CT_THRESHOLD_DEFAULT,
    ptLower: LOWER_PT_THRESHOLD_DEFAULT,
    ptUpper: UPPER_PT_THRESHOLD_DEFAULT,
    weight: WEIGHT_DEFAULT,
  });

  const runCommand = useCallback(
    (commandName, commandOptions = {}) => {
      return commandsManager.runCommand(commandName, commandOptions);
    },
    [commandsManager]
  );

  const toolsConfigInfo = useMemo(
    () => getToolsConfigInfo({ servicesManager, config, dispatch, runCommand }),
    [servicesManager, config, runCommand]
  );
  const toolConfigInfo = toolsConfigInfo[activePrimaryTool];

  const handleROIThresholding = useCallback(() => {
    const labelmap = runCommand('thresholdSegmentationByRectangleROITool', {
      segmentationId: selectedSegmentationId,
      config,
    });

    if (!labelmap) {
      return;
    }

    const lesionStats = runCommand('getLesionStats', { labelmap });
    const suvPeak = runCommand('calculateSuvPeak', { labelmap });
    const lesionGlyoclysisStats = lesionStats.volume * lesionStats.meanValue;

    // update segDetails with the suv peak for the active segmentation
    const segmentation = segmentationService.getSegmentation(
      selectedSegmentationId
    );

    const cachedStats = {
      lesionStats,
      suvPeak,
      lesionGlyoclysisStats,
    };

    const notYetUpdatedAtSource = true;
    segmentationService.addOrUpdateSegmentation(
      {
        ...segmentation,
        ...Object.assign(segmentation.cachedStats, cachedStats),
        displayText: [`SUV Peak: ${suvPeak.suvPeak.toFixed(2)}`],
      },
      notYetUpdatedAtSource
    );
  }, [selectedSegmentationId, config, runCommand, segmentationService]);

  /**
   * Update UI based on segmentation changes (added, removed, updated)
   */
  useEffect(() => {
    // ~~ Subscription
    const added = segmentationService.EVENTS.SEGMENTATION_ADDED;
    const updated = segmentationService.EVENTS.SEGMENTATION_UPDATED;
    const removed = segmentationService.EVENTS.SEGMENTATION_REMOVED;
    const subscriptions = [];

    [added, updated, removed].forEach(evt => {
      const { unsubscribe } = segmentationService.subscribe(evt, () => {
        const segmentations = segmentationService.getSegmentations();
        setSegmentations(segmentations);
      });
      subscriptions.push(unsubscribe);
    });

    return () => {
      subscriptions.forEach(unsub => {
        unsub();
      });
    };
  }, [segmentationService]);

  useEffect(() => {
    const { unsubscribe } = toolGroupService.subscribe(
      toolGroupService.EVENTS.PRIMARY_TOOL_ACTIVATED,
      ({ toolName }) => {
        setActivePrimaryTool(toolName);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [toolGroupService]);

  return (
    <>
      <div className="flex flex-col">
        <div className="overflow-x-hidden overflow-y-auto invisible-scrollbar">
          <div className="flex mx-4 my-4 mb-4 space-x-4">
            <Button
              className="grow"
              onClick={() => {
                setLabelmapLoading(true);
                runCommand('createNewLabelmapFromPT', {
                  label: `Segmentation ${nextSegmentationSequenceId}`,
                }).then(() => {
                  setNextSegmentationSequenceId(prev => prev + 1);
                  setLabelmapLoading(false);
                });
              }}
            >
              {labelmapLoading ? 'loading ...' : 'New Label'}
            </Button>
            {showThresholdRunButton && (
              <Button className="grow" onClick={handleROIThresholding}>
                Run
              </Button>
            )}
          </div>

          {selectedSegmentationId && toolConfigInfo && (
            <>
              <div
                className="flex items-center justify-around h-8 mb-2 border-t outline-none cursor-pointer select-none bg-secondary-dark first:border-0 border-secondary-light"
                onClick={() => {
                  setShowConfig(!showConfig);
                }}
              >
                <div className="px-4 text-base text-white">
                  {t(toolConfigInfo.title)}
                </div>
              </div>

              {showConfig && <toolConfigInfo.component />}
            </>
          )}
          {/* show segmentation table */}
          <div className="mt-4">
            {segmentations?.length ? (
              <SegmentationTable
                title={t('Segmentations')}
                segmentations={segmentations}
                activeSegmentationId={selectedSegmentationId}
                onClick={id => {
                  runCommand('setSegmentationActiveForToolGroups', {
                    segmentationId: id,
                  });
                }}
                onToggleVisibility={id => {
                  segmentationService.toggleSegmentationVisibility(id);
                }}
                onToggleVisibilityAll={ids => {
                  ids.map(id => {
                    segmentationService.toggleSegmentationVisibility(id);
                  });
                }}
                onDelete={id => segmentationService.remove(id)}
                onEdit={id => segmentationEditHandler({ id, servicesManager })}
              />
            ) : null}
          </div>
          {/* <ExportReports
            segmentations={segmentations}
            tmtvValue={tmtvValue}
            config={config}
            commandsManager={commandsManager}
          /> */}
        </div>
      </div>
    </>
  );
}

ROISegmentationPanel.propTypes = {
  servicesManager: PropTypes.instanceOf(ServicesManager).isRequired,
  commandsManager: PropTypes.instanceOf(CommandsManager).isRequired,
};
