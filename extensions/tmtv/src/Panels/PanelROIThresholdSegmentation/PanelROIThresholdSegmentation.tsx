import React, { useEffect, useState, useCallback, useReducer } from 'react';
import PropTypes from 'prop-types';
import { SegmentationTable, Button, Icon } from '@ohif/ui';

import { useTranslation } from 'react-i18next';
import segmentationEditHandler from './segmentationEditHandler';
import ExportReports from './ExportReports';
import ROIThresholdConfiguration, {
  ROI_STAT,
} from './ROIThresholdConfiguration';

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
}) {
  const { segmentationService } = servicesManager.services;

  const { t } = useTranslation('PanelSUV');
  const [showConfig, setShowConfig] = useState(false);
  const [labelmapLoading, setLabelmapLoading] = useState(false);
  const [selectedSegmentationId, setSelectedSegmentationId] = useState(null);
  const [segmentations, setSegmentations] = useState(() =>
    segmentationService.getSegmentations()
  );

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

  return (
    <>
      <div className="flex flex-col">
        <div className="overflow-x-hidden overflow-y-auto invisible-scrollbar">
          <div className="flex mx-4 my-4 mb-4 space-x-4">
            <Button
              color="primary"
              onClick={() => {
                setLabelmapLoading(true);
                setTimeout(() => {
                  runCommand('createNewLabelmapFromPT').then(segmentationId => {
                    setLabelmapLoading(false);
                    setSelectedSegmentationId(segmentationId);
                  });
                });
              }}
            >
              {labelmapLoading ? 'loading ...' : 'New Label'}
            </Button>
            <Button color="primary" onClick={handleROIThresholding}>
              Run
            </Button>
          </div>
          <div
            className="flex items-center justify-around h-8 mb-2 border-t outline-none cursor-pointer select-none bg-secondary-dark first:border-0 border-secondary-light"
            onClick={() => {
              setShowConfig(!showConfig);
            }}
          >
            <div className="px-4 text-base text-white">
              {t('ROI Threshold Configuration')}
            </div>
          </div>
          {showConfig && (
            <ROIThresholdConfiguration
              config={config}
              dispatch={dispatch}
              runCommand={runCommand}
            />
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
                  setSelectedSegmentationId(id);
                }}
                onToggleVisibility={id => {
                  segmentationService.toggleSegmentationVisibility(id);
                }}
                onToggleVisibilityAll={ids => {
                  ids.map(id => {
                    segmentationService.toggleSegmentationVisibility(id);
                  });
                }}
                onDelete={id => {
                  segmentationService.remove(id);
                }}
                onEdit={id => {
                  segmentationEditHandler({
                    id,
                    servicesManager,
                  });
                }}
              />
            ) : null}
          </div>
          {tmtvValue !== null ? (
            <div className="flex items-baseline justify-between px-2 py-1 mt-4 bg-secondary-dark">
              <span className="text-base font-bold tracking-widest text-white uppercase">
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
        className="opacity-50 hover:opacity-80 flex items-center justify-center text-blue-400 mt-auto cursor-pointer mb-4"
        onClick={() => {
          // navigate to a url in a new tab
          window.open(
            'https://github.com/OHIF/Viewers/blob/master/modes/tmtv/README.md',
            '_blank'
          );
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
