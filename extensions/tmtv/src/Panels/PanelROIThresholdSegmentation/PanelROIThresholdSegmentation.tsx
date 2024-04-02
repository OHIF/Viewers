import React, { useEffect, useState, useCallback, useReducer } from 'react';
import PropTypes from 'prop-types';
import { SegmentationGroupTableExpanded, Button, Icon } from '@ohif/ui';
import { createReportAsync } from '@ohif/extension-default';

import { useTranslation } from 'react-i18next';
import segmentationEditHandler from './segmentationEditHandler';
import ExportReports from './ExportReports';
import ROIThresholdConfiguration, { ROI_STAT } from './ROIThresholdConfiguration';
import callInputDialog from './callInputDialog';
import callColorPickerDialog from './colorPickerDialog';

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

export default function PanelRoiThresholdSegmentation({
  servicesManager,
  commandsManager,
  extensionManager,
}) {
  const { segmentationService, viewportGridService, uiDialogService } = servicesManager.services;

  const { t } = useTranslation('PanelSUV');
  const [showConfig, setShowConfig] = useState(false);
  const [selectedSegmentationId, setSelectedSegmentationId] = useState(null);
  const [segmentations, setSegmentations] = useState(() => segmentationService.getSegmentations());

  const [config, dispatch] = useReducer(reducer, {
    strategy: DEFAULT_STRATEGY,
    ctLower: LOWER_CT_THRESHOLD_DEFAULT,
    ctUpper: UPPER_CT_THRESHOLD_DEFAULT,
    ptLower: LOWER_PT_THRESHOLD_DEFAULT,
    ptUpper: UPPER_PT_THRESHOLD_DEFAULT,
    weight: WEIGHT_DEFAULT,
  });

  const [tmtvValue, setTmtvValue] = useState(null);

  const runCommand = useCallback(
    (commandName, commandOptions = {}) => {
      return commandsManager.runCommand(commandName, commandOptions);
    },
    [commandsManager]
  );

  const handleTMTVCalculation = useCallback(() => {
    const tmtv = runCommand('calculateTMTV', { segmentations });

    if (tmtv !== undefined) {
      setTmtvValue(tmtv.toFixed(2));
    }
  }, [segmentations, runCommand]);

  const handleROIThresholding = useCallback(() => {
    const labelmap = runCommand('thresholdSegmentationByRectangleROITool', {
      segmentationId: selectedSegmentationId,
      config,
    });

    const lesionStats = runCommand('getLesionStats', { labelmap });
    const suvPeak = runCommand('calculateSuvPeak', { labelmap });
    const lesionGlyoclysisStats = lesionStats.volume * lesionStats.meanValue;

    // update segDetails with the suv peak for the active segmentation
    const segmentation = segmentationService.getSegmentation(selectedSegmentationId);

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

    handleTMTVCalculation();
  }, [selectedSegmentationId, config]);

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
        setSegmentations(segmentations);
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
        setSegmentations(segmentations);

        if (segmentations.length > 0) {
          setSelectedSegmentationId(segmentations[0].id);
          handleTMTVCalculation();
        } else {
          setSelectedSegmentationId(null);
          setTmtvValue(null);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Whenever the segmentations change, update the TMTV calculations
   */
  useEffect(() => {
    if (!selectedSegmentationId && segmentations.length > 0) {
      setSelectedSegmentationId(segmentations[0].id);
    }

    handleTMTVCalculation();
  }, [segmentations, selectedSegmentationId]);

  const onSegmentationClick = (segmentationId: string) => {
    segmentationService.setActiveSegmentationForToolGroup(segmentationId);
    setSelectedSegmentationId(segmentationId);
  };

  const onSegmentationAdd = async () => {
    runCommand('createNewLabelmapFromPT').then(segmentationId => {
      setSelectedSegmentationId(segmentationId);
    });
  };

  const onSegmentAdd = segmentationId => {
    segmentationService.addSegment(segmentationId);
  };

  const getToolGroupIds = segmentationId => {
    const toolGroupIds = segmentationService.getToolGroupIdsWithSegmentation(segmentationId);

    return toolGroupIds;
  };

  const onSegmentClick = (segmentationId, segmentIndex) => {
    segmentationService.setActiveSegment(segmentationId, segmentIndex);

    const toolGroupIds = getToolGroupIds(segmentationId);

    toolGroupIds.forEach(toolGroupId => {
      // const toolGroupId =
      segmentationService.setActiveSegmentationForToolGroup(segmentationId, toolGroupId);
      segmentationService.jumpToSegmentCenter(segmentationId, segmentIndex, toolGroupId);
    });
  };

  const _setSegmentationConfiguration = useCallback(
    (segmentationId, key, value) => {
      segmentationService.setConfiguration({
        segmentationId,
        [key]: value,
      });
    },
    [segmentationService]
  );

  const onToggleSegmentVisibility = (segmentationId, segmentIndex) => {
    const segmentation = segmentationService.getSegmentation(segmentationId);
    const segmentInfo = segmentation.segments[segmentIndex];
    const isVisible = !segmentInfo.isVisible;
    const toolGroupIds = getToolGroupIds(segmentationId);
    toolGroupIds.forEach(toolGroupId => {
      segmentationService.setSegmentVisibility(
        segmentationId,
        segmentIndex,
        isVisible,
        toolGroupId
      );
    });
  };

  const onSegmentDelete = (segmentationId, segmentIndex) => {
    segmentationService.removeSegment(segmentationId, segmentIndex);
  };

  const onSegmentEdit = (segmentationId, segmentIndex) => {
    const segmentation = segmentationService.getSegmentation(segmentationId);

    const segment = segmentation.segments[segmentIndex];
    const { label } = segment;

    callInputDialog(uiDialogService, label, (label, actionId) => {
      if (label === '') {
        return;
      }

      segmentationService.setSegmentLabel(segmentationId, segmentIndex, label);
    });
  };

  const onToggleSegmentLock = (segmentationId, segmentIndex) => {
    segmentationService.toggleSegmentLocked(segmentationId, segmentIndex);
  };

  const onSegmentColorClick = (segmentationId, segmentIndex) => {
    const segmentation = segmentationService.getSegmentation(segmentationId);

    const segment = segmentation.segments[segmentIndex];
    const { color, opacity } = segment;

    const rgbaColor = {
      r: color[0],
      g: color[1],
      b: color[2],
      a: opacity / 255.0,
    };

    callColorPickerDialog(uiDialogService, rgbaColor, (newRgbaColor, actionId) => {
      if (actionId === 'cancel') {
        return;
      }

      segmentationService.setSegmentRGBAColor(segmentationId, segmentIndex, [
        newRgbaColor.r,
        newRgbaColor.g,
        newRgbaColor.b,
        newRgbaColor.a * 255.0,
      ]);
    });
  };

  const storeSegmentation = async segmentationId => {
    const datasources = extensionManager.getActiveDataSource();

    const displaySetInstanceUIDs = await createReportAsync({
      servicesManager,
      getReport: () =>
        commandsManager.runCommand('storeSegmentation', {
          segmentationId,
          dataSource: datasources[0],
        }),
      reportType: 'Segmentation',
    });

    // Show the exported report in the active viewport as read only (similar to SR)
    if (displaySetInstanceUIDs) {
      // clear the segmentation that we exported, similar to the storeMeasurement
      // where we remove the measurements and prompt again the user if they would like
      // to re-read the measurements in a SR read only viewport
      segmentationService.remove(segmentationId);

      viewportGridService.setDisplaySetsForViewport({
        viewportId: viewportGridService.getActiveViewportId(),
        displaySetInstanceUIDs,
      });
    }
  };

  const onSegmentationDownloadRTSS = segmentationId => {
    commandsManager.runCommand('downloadRTSS', {
      segmentationId,
    });
  };

  const onSegmentationDownload = segmentationId => {
    commandsManager.runCommand('downloadSegmentation', {
      segmentationId,
    });
  };

  return (
    <>
      <div className="flex flex-col">
        <div className="invisible-scrollbar overflow-y-auto overflow-x-hidden">
          <div className="mx-4 my-4 mb-4 flex space-x-4">
            <Button onClick={handleROIThresholding}>Run</Button>
          </div>
          <div
            className="bg-secondary-dark border-secondary-light mb-2 flex h-8 cursor-pointer select-none items-center justify-around border-t outline-none first:border-0"
            onClick={() => {
              setShowConfig(!showConfig);
            }}
          >
            <div className="px-4 text-base text-white">{t('ROI Threshold Configuration')}</div>
          </div>
          {showConfig && (
            <ROIThresholdConfiguration
              config={config}
              dispatch={dispatch}
              runCommand={runCommand}
            />
          )}
          {/* show segmentation table */}
          <div className="flex min-h-0 flex-col bg-black text-[13px] font-[300]">
            <SegmentationGroupTableExpanded
              disableEditing={false}
              showAddSegmentation={true}
              showAddSegment={true}
              showDeleteSegment={true}
              segmentations={segmentations}
              onSegmentationAdd={onSegmentationAdd}
              onSegmentationClick={onSegmentationClick}
              onToggleSegmentationVisibility={id => {
                segmentationService.toggleSegmentationVisibility(id);
              }}
              onToggleSegmentVisibility={onToggleSegmentVisibility}
              onSegmentationDelete={id => {
                segmentationService.remove(id);
              }}
              onSegmentationEdit={id => {
                segmentationEditHandler({
                  id,
                  servicesManager,
                });
              }}
              segmentationConfig={{ initialConfig: segmentationService.getConfiguration() }}
              onSegmentAdd={onSegmentAdd}
              onSegmentClick={onSegmentClick}
              onSegmentDelete={onSegmentDelete}
              onSegmentEdit={onSegmentEdit}
              onToggleSegmentLock={onToggleSegmentLock}
              onSegmentColorClick={onSegmentColorClick}
              storeSegmentation={storeSegmentation}
              onSegmentationDownloadRTSS={onSegmentationDownloadRTSS}
              onSegmentationDownload={onSegmentationDownload}
              setRenderOutline={value =>
                _setSegmentationConfiguration(selectedSegmentationId, 'renderOutline', value)
              }
              setOutlineOpacityActive={value =>
                _setSegmentationConfiguration(selectedSegmentationId, 'outlineOpacity', value)
              }
              setRenderFill={value =>
                _setSegmentationConfiguration(selectedSegmentationId, 'renderFill', value)
              }
              setRenderInactiveSegmentations={value =>
                _setSegmentationConfiguration(
                  selectedSegmentationId,
                  'renderInactiveSegmentations',
                  value
                )
              }
              setOutlineWidthActive={value =>
                _setSegmentationConfiguration(selectedSegmentationId, 'outlineWidthActive', value)
              }
              setFillAlpha={value =>
                _setSegmentationConfiguration(selectedSegmentationId, 'fillAlpha', value)
              }
              setFillAlphaInactive={value =>
                _setSegmentationConfiguration(selectedSegmentationId, 'fillAlphaInactive', value)
              }
            />
          </div>
          {tmtvValue !== null ? (
            <div className="bg-secondary-dark mt-4 flex items-baseline justify-between px-2 py-1">
              <span className="text-base font-bold uppercase tracking-widest text-white">
                {'TMTV:'}
              </span>
              <div className="text-white">{`${tmtvValue} mL`}</div>
            </div>
          ) : null}
          <ExportReports
            segmentations={segmentations}
            tmtvValue={tmtvValue}
            config={config}
            commandsManager={commandsManager}
          />
        </div>
      </div>
      <div
        className="absolute bottom-1 flex cursor-pointer items-center justify-center text-blue-400 opacity-50 hover:opacity-80"
        onClick={() => {
          // navigate to a url in a new tab
          window.open('https://github.com/OHIF/Viewers/blob/master/modes/tmtv/README.md', '_blank');
        }}
      >
        <Icon
          width="15px"
          height="15px"
          name={'info'}
          className={'text-primary-active ml-4 mr-3'}
        />
        <span>{'User Guide'}</span>
      </div>
    </>
  );
}

PanelRoiThresholdSegmentation.propTypes = {
  commandsManager: PropTypes.shape({
    runCommand: PropTypes.func.isRequired,
  }),
  servicesManager: PropTypes.shape({
    services: PropTypes.shape({
      segmentationService: PropTypes.shape({
        getSegmentation: PropTypes.func.isRequired,
        getSegmentations: PropTypes.func.isRequired,
        toggleSegmentationVisibility: PropTypes.func.isRequired,
        subscribe: PropTypes.func.isRequired,
        EVENTS: PropTypes.object.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};
