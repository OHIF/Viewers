import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Input,
  SegmentationTable,
  Select,
  Button,
  ButtonGroup,
  Dialog,
} from '@ohif/ui';
import { useTranslation } from 'react-i18next';
import createAndDownloadTMTVReport from '../utils/createAndDownloadTMTVReport';

const options = [
  { value: 'roiStat', label: 'Percentage of Max Value', placeHolder: ['Max'] },
  { value: 'range', label: 'Range Threshold', placeHolder: ['Range'] },
];

export default function PanelRoiThresholdSegmentation({
  servicesManager,
  commandsManager,
}) {
  const { SegmentationService, UIDialogService } = servicesManager.services;

  const { t } = useTranslation('PanelSUV');
  const [showConfig, setShowConfig] = useState(false);
  const [labelmapLoading, setLabelmapLoading] = useState(false);
  const [selectedSegmentationId, setSelectedSegmentationId] = useState(null);
  const [segmentations, setSegmentations] = useState(() =>
    SegmentationService.getSegmentations()
  );
  const [config, setConfig] = useState({
    strategy: 'roiStat',
    minValue: 0,
    maxValue: 100,
    weight: 0.41,
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

    const segmentation = SegmentationService.getSegmentation(
      selectedSegmentationId
    );

    const data = {
      lesionStats,
      suvPeak,
      lesionGlyoclysisStats,
    };

    const notYetUpdatedAtSource = true;
    SegmentationService.addOrUpdateSegmentation(
      selectedSegmentationId,
      {
        ...segmentation,
        data: Object.assign(segmentation.data, data),
        text: [`SUV Peak: ${suvPeak.suvPeak.toFixed(2)}`],
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
    const added = SegmentationService.EVENTS.SEGMENTATION_ADDED;
    const updated = SegmentationService.EVENTS.SEGMENTATION_UPDATED;
    const removed = SegmentationService.EVENTS.SEGMENTATION_REMOVED;
    const subscriptions = [];

    [added, updated, removed].forEach(evt => {
      const { unsubscribe } = SegmentationService.subscribe(evt, () => {
        const segmentations = SegmentationService.getSegmentations();
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

  /**
   * Toggle visibility of the segmentation
   */
  useEffect(() => {
    const subscription = SegmentationService.subscribe(
      SegmentationService.EVENTS.SEGMENTATION_VISIBILITY_CHANGED,
      ({ segmentation }) => {
        runCommand('toggleSegmentationVisibility', {
          segmentationId: segmentation.id,
        });
      }
    );
    return () => {
      subscription.unsubscribe();
    };
  }, [SegmentationService]);

  /**
   * Whenever the segmentations change, update the TMTV calculations
   */
  useEffect(() => {
    if (!selectedSegmentationId && segmentations.length > 0) {
      setSelectedSegmentationId(segmentations[0].id);
    }

    handleTMTVCalculation();
  }, [segmentations, selectedSegmentationId]);

  const handleRTExport = () => {
    // get all the RoiThresholdManual Rois
    const toolStates = getDefaultToolStateManager();

    // iterate inside all the frameOfReferenceUIDs inside the toolState
    let roiThresholdManualRois = [];

    const framesOfReference = toolStates.getFramesOfReference();
    framesOfReference.forEach(frameOfReferenceUID => {
      const toolState = toolStates.get(
        frameOfReferenceUID,
        'RectangleRoiStartEndThreshold'
      );

      if (toolState) {
        roiThresholdManualRois = roiThresholdManualRois.concat(toolState);
      }
    });

    runCommand('saveRTReport', {
      toolState: roiThresholdManualRois,
    });
  };

  return (
    <div className="overflow-x-hidden overflow-y-auto invisible-scrollbar">
      <div>
        <div className="flex mx-4 my-4 mb-4 space-x-4">
          <Button
            color="primary"
            onClick={() => {
              setLabelmapLoading(true);
              runCommand('createNewLabelmapFromPT').then(segmentationId => {
                setLabelmapLoading(false);
                setSelectedSegmentationId(segmentationId);
              });
            }}
            className="text-xs text-white border-b border-transparent "
          >
            New Label
          </Button>
          <Button
            color="primary"
            onClick={handleROIThresholding}
            className="text-xs text-white border-b border-transparent "
          >
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
            setConfig={setConfig}
            runCommand={runCommand}
          />
        )}
        {labelmapLoading ? (
          <div className="text-white">Loading Segmentation Panel ... </div>
        ) : null}

        {/* show segmentation table */}
        <div className="mt-4">
          {segmentations?.length ? (
            <SegmentationTable
              title={t('Segmentations')}
              amount={segmentations.length}
              segmentations={segmentations}
              activeSegmentationId={selectedSegmentationId}
              onClick={id => {
                runCommand('setSegmentationActiveForToolGroups', {
                  segmentationId: id,
                });
                setSelectedSegmentationId(id);
              }}
              onToggleVisibility={id => {
                SegmentationService.toggleSegmentationsVisibility([id]);
              }}
              onToggleVisibilityAll={ids => {
                SegmentationService.toggleSegmentationsVisibility(ids);
              }}
              onDelete={id => {
                SegmentationService.remove(id);
              }}
              onEdit={id => {
                onSegmentationItemEditHandler({
                  id,
                  SegmentationService,
                  UIDialogService,
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
        {segmentations?.length ? (
          <div className="flex justify-center mt-4 space-x-2">
            <ButtonGroup color="black" size="inherit">
              <Button
                className="px-2 py-2 text-base"
                disabled={tmtvValue === null}
                onClick={() => {
                  runCommand('exportTMTVReportCSV', {
                    segmentations,
                    tmtv: tmtvValue,
                    config,
                  });
                }}
              >
                {t('Export CSV')}
              </Button>
            </ButtonGroup>
            <ButtonGroup color="black" size="inherit">
              <Button
                className="px-2 py-2 text-base"
                onClick={handleRTExport}
                disabled={tmtvValue === null}
              >
                {t('Create RT Report')}
              </Button>
            </ButtonGroup>
          </div>
        ) : null}
      </div>
    </div>
  );
}

PanelRoiThresholdSegmentation.propTypes = {
  commandsManager: PropTypes.shape({
    runCommand: PropTypes.func.isRequired,
  }),
  servicesManager: PropTypes.shape({
    services: PropTypes.shape({
      SegmentationService: PropTypes.shape({
        getSegmentation: PropTypes.func.isRequired,
        getSegmentations: PropTypes.func.isRequired,
        toggleSegmentationsVisibility: PropTypes.func.isRequired,
        subscribe: PropTypes.func.isRequired,
        EVENTS: PropTypes.object.isRequired,
        VALUE_TYPES: PropTypes.object.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};

function onSegmentationItemEditHandler({
  id,
  SegmentationService,
  UIDialogService,
}) {
  const segmentation = SegmentationService.getSegmentation(id);

  const onSubmitHandler = ({ action, value }) => {
    switch (action.id) {
      case 'save': {
        SegmentationService.addOrUpdateSegmentation(
          id,
          {
            ...segmentation,
            ...value,
          },
          true
        );
      }
    }
    UIDialogService.dismiss({ id: 'enter-annotation' });
  };

  UIDialogService.create({
    id: 'enter-annotation',
    centralize: true,
    isDraggable: false,
    showOverlay: true,
    content: Dialog,
    contentProps: {
      title: 'Enter your annotation',
      noCloseButton: true,
      value: { label: segmentation.label || '' },
      body: ({ value, setValue }) => {
        const onChangeHandler = event => {
          event.persist();
          setValue(value => ({ ...value, label: event.target.value }));
        };

        const onKeyPressHandler = event => {
          if (event.key === 'Enter') {
            onSubmitHandler({ value, action: { id: 'save' } });
          }
        };
        return (
          <div className="p-4 bg-primary-dark">
            <Input
              autoFocus
              className="mt-2 bg-black border-primary-main"
              type="text"
              containerClassName="mr-2"
              value={value.label}
              onChange={onChangeHandler}
              onKeyPress={onKeyPressHandler}
            />
          </div>
        );
      },
      actions: [
        // temp: swap button types until colors are updated
        { id: 'cancel', text: 'Cancel', type: 'primary' },
        { id: 'save', text: 'Save', type: 'secondary' },
      ],
      onSubmit: onSubmitHandler,
    },
  });
}

function ROIThresholdConfiguration({ config, setConfig, runCommand }) {
  const { t } = useTranslation('ROIThresholdConfiguration');

  return (
    <div className="flex flex-col px-4 space-y-4 bg-primary-dark">
      <div className="flex items-end space-x-2">
        <div className="flex flex-col w-1/2 mt-2 ">
          <Select
            label={t('Strategy')}
            closeMenuOnSelect={true}
            className="mr-2 bg-black border-primary-main "
            options={options}
            placeholder={
              options.find(option => option.value === config.strategy)
                .placeHolder
            }
            value={config.strategy}
            onChange={({ value }) => {
              setConfig((prevConfig = {}) => {
                return {
                  ...prevConfig,
                  strategy: value,
                };
              });
            }}
          />
        </div>
        <div className="w-1/2">
          <ButtonGroup color="black" size="inherit">
            <Button
              className="px-2 py-2 text-base"
              onClick={() => runCommand('setStartSliceForROIThresholdTool')}
            >
              {t('Start')}
            </Button>
          </ButtonGroup>
          <ButtonGroup color="black" size="inherit">
            <Button
              className="px-2 py-2 text-base"
              onClick={() => runCommand('setEndSliceForROIThresholdTool')}
            >
              {t('End')}
            </Button>
          </ButtonGroup>
        </div>
      </div>

      {config.strategy === 'roiStat' && (
        <Input
          label={t('Percentage of Max SUV')}
          labelClassName="text-white"
          className="mt-2 bg-black border-primary-main"
          type="text"
          containerClassName="mr-2"
          value={config.weight}
          onChange={e => {
            setConfig((prevConfig = {}) => {
              return {
                ...prevConfig,
                weight: Number(e.target.value),
              };
            });
          }}
        />
      )}
      {config.strategy !== 'roiStat' && (
        <div className="flex justify-between">
          <Input
            label={t('Min Value')}
            labelClassName="text-white"
            className="mt-2 bg-black border-primary-main"
            type="text"
            containerClassName="mr-2"
            value={config.minValue}
            onChange={e => {
              setConfig((prevConfig = {}) => {
                return {
                  ...prevConfig,
                  minValue: Number(e.target.value),
                };
              });
            }}
          />
          <Input
            label={t('Max Value')}
            labelClassName="text-white"
            className="mt-2 bg-black border-primary-main"
            type="text"
            containerClassName="mr-2"
            value={config.maxValue}
            onChange={e => {
              setConfig((prevConfig = {}) => {
                return {
                  ...prevConfig,
                  maxValue: Number(e.target.value),
                };
              });
            }}
          />
        </div>
      )}
    </div>
  );
}
