import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { SegmentationGroupTableExpanded, Icon } from '@ohif/ui';
import { createReportAsync } from '@ohif/extension-default';

import segmentationEditHandler from './segmentationEditHandler';
import ExportReports from './ExportReports';
import callInputDialog from './callInputDialog';
import callColorPickerDialog from './colorPickerDialog';

export default function PanelRoiThresholdSegmentation({
  servicesManager,
  commandsManager,
  extensionManager,
}) {
  const { segmentationService, viewportGridService, uiDialogService } = servicesManager.services;

  const [selectedSegmentationId, setSelectedSegmentationId] = useState(null);
  const [segmentations, setSegmentations] = useState(() => segmentationService.getSegmentations());

  const runCommand = useCallback(
    (commandName, commandOptions = {}) => {
      return commandsManager.runCommand(commandName, commandOptions);
    },
    [commandsManager]
  );

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
  }, []);

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

  const tmtvValue = segmentations?.[0]?.cachedStats?.tmtv?.value || null;
  const config = segmentations?.[0]?.cachedStats?.tmtv?.config || {};

  return (
    <>
      <div className="flex flex-col">
        <div className="invisible-scrollbar overflow-y-auto overflow-x-hidden">
          {/* show segmentation table */}
          <div className="flex min-h-0 flex-col bg-black text-[13px] font-[300]">
            <SegmentationGroupTableExpanded
              disableEditing={false}
              showAddSegmentation={true}
              showAddSegment={false}
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
            <div className="bg-secondary-dark mt-1 flex items-baseline justify-between px-2 py-1">
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
