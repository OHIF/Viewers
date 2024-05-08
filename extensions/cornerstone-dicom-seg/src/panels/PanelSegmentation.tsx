import { createReportAsync } from '@ohif/extension-default';
import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { SegmentationGroupTable, SegmentationGroupTableExpanded } from '@ohif/ui';
import { SegmentationPanelMode } from '../types/segmentation';
import callInputDialog from './callInputDialog';
import callColorPickerDialog from './colorPickerDialog';
import { useTranslation } from 'react-i18next';

const components = {
  [SegmentationPanelMode.Expanded]: SegmentationGroupTableExpanded,
  [SegmentationPanelMode.Dropdown]: SegmentationGroupTable,
};

export default function PanelSegmentation({
  servicesManager,
  commandsManager,
  extensionManager,
  configuration,
}: withAppTypes) {
  const {
    segmentationService,
    viewportGridService,
    uiDialogService,
    displaySetService,
    cornerstoneViewportService,
  } = servicesManager.services;

  const { t } = useTranslation('PanelSegmentation');

  const [selectedSegmentationId, setSelectedSegmentationId] = useState(null);
  const [addSegmentationClassName, setAddSegmentationClassName] = useState('');
  const [segmentationConfiguration, setSegmentationConfiguration] = useState(
    segmentationService.getConfiguration()
  );

  const [segmentations, setSegmentations] = useState(() => segmentationService.getSegmentations());

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
        setSegmentationConfiguration(segmentationService.getConfiguration());
      });
      subscriptions.push(unsubscribe);
    });

    return () => {
      subscriptions.forEach(unsub => {
        unsub();
      });
    };
  }, []);

  // temporary measure to not allow add segmentation when the selected viewport
  // is stack viewport
  useEffect(() => {
    const handleActiveViewportChange = viewportId => {
      const displaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(
        viewportId || viewportGridService.getActiveViewportId()
      );

      if (!displaySetUIDs) {
        return;
      }

      const isReconstructable =
        displaySetUIDs?.some(displaySetUID => {
          const displaySet = displaySetService.getDisplaySetByUID(displaySetUID);
          return displaySet?.isReconstructable;
        }) || false;

      if (isReconstructable) {
        setAddSegmentationClassName('');
      } else {
        setAddSegmentationClassName('ohif-disabled');
      }
    };

    // Handle initial state
    handleActiveViewportChange();

    const changedGrid = viewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED;
    const ready = viewportGridService.EVENTS.VIEWPORTS_READY;

    const subsGrid = [];
    [ready, changedGrid].forEach(evt => {
      const { unsubscribe } = viewportGridService.subscribe(evt, ({ viewportId }) => {
        handleActiveViewportChange(viewportId);
      });

      subsGrid.push(unsubscribe);
    });

    const changedData = cornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED;

    const subsData = [];
    [changedData].forEach(evt => {
      const { unsubscribe } = cornerstoneViewportService.subscribe(evt, () => {
        handleActiveViewportChange();
      });

      subsData.push(unsubscribe);
    });

    // Clean up
    return () => {
      subsGrid.forEach(unsub => unsub());
      subsData.forEach(unsub => unsub());
    };
  }, []);

  const getToolGroupIds = segmentationId => {
    const toolGroupIds = segmentationService.getToolGroupIdsWithSegmentation(segmentationId);

    return toolGroupIds;
  };

  const onSegmentationAdd = async () => {
    commandsManager.runCommand('createEmptySegmentationForViewport', {
      viewportId: viewportGridService.getActiveViewportId(),
    });
  };

  const onSegmentationClick = (segmentationId: string) => {
    segmentationService.setActiveSegmentationForToolGroup(segmentationId);
  };

  const onSegmentationDelete = (segmentationId: string) => {
    segmentationService.remove(segmentationId);
  };

  const onSegmentAdd = segmentationId => {
    segmentationService.addSegment(segmentationId);
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

  const onSegmentationEdit = segmentationId => {
    const segmentation = segmentationService.getSegmentation(segmentationId);
    const { label } = segmentation;

    callInputDialog(uiDialogService, label, (label, actionId) => {
      if (label === '') {
        return;
      }

      segmentationService.addOrUpdateSegmentation(
        {
          id: segmentationId,
          label,
        },
        false, // suppress event
        true // notYetUpdatedAtSource
      );
    });
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

  const onSegmentDelete = (segmentationId, segmentIndex) => {
    segmentationService.removeSegment(segmentationId, segmentIndex);
  };

  // segment hide
  const onToggleSegmentVisibility = (segmentationId, segmentIndex) => {
    const segmentation = segmentationService.getSegmentation(segmentationId);
    const segmentInfo = segmentation.segments[segmentIndex];
    const isVisible = !segmentInfo.isVisible;
    const toolGroupIds = getToolGroupIds(segmentationId);

    // Todo: right now we apply the visibility to all tool groups
    toolGroupIds.forEach(toolGroupId => {
      segmentationService.setSegmentVisibility(
        segmentationId,
        segmentIndex,
        isVisible,
        toolGroupId
      );
    });
  };

  const onToggleSegmentLock = (segmentationId, segmentIndex) => {
    segmentationService.toggleSegmentLocked(segmentationId, segmentIndex);
  };

  const onToggleSegmentationVisibility = segmentationId => {
    segmentationService.toggleSegmentationVisibility(segmentationId);
    const segmentation = segmentationService.getSegmentation(segmentationId);
    const isVisible = segmentation.isVisible;
    const segments = segmentation.segments;

    const toolGroupIds = getToolGroupIds(segmentationId);

    toolGroupIds.forEach(toolGroupId => {
      segments.forEach((segment, segmentIndex) => {
        segmentationService.setSegmentVisibility(
          segmentationId,
          segmentIndex,
          isVisible,
          toolGroupId
        );
      });
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

  const onSegmentationDownload = segmentationId => {
    commandsManager.runCommand('downloadSegmentation', {
      segmentationId,
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

  const SegmentationGroupTableComponent =
    components[configuration?.segmentationPanelMode] || SegmentationGroupTable;
  const allowAddSegment = configuration?.addSegment;
  const onSegmentationAddWrapper =
    configuration?.onSegmentationAdd && typeof configuration?.onSegmentationAdd === 'function'
      ? configuration?.onSegmentationAdd
      : onSegmentationAdd;

  return (
    <SegmentationGroupTableComponent
      title={t('Segmentations')}
      segmentations={segmentations}
      disableEditing={configuration.disableEditing}
      activeSegmentationId={selectedSegmentationId || ''}
      onSegmentationAdd={onSegmentationAddWrapper}
      addSegmentationClassName={addSegmentationClassName}
      showAddSegment={allowAddSegment}
      onSegmentationClick={onSegmentationClick}
      onSegmentationDelete={onSegmentationDelete}
      onSegmentationDownload={onSegmentationDownload}
      onSegmentationDownloadRTSS={onSegmentationDownloadRTSS}
      storeSegmentation={storeSegmentation}
      onSegmentationEdit={onSegmentationEdit}
      onSegmentClick={onSegmentClick}
      onSegmentEdit={onSegmentEdit}
      onSegmentAdd={onSegmentAdd}
      onSegmentColorClick={onSegmentColorClick}
      onSegmentDelete={onSegmentDelete}
      onToggleSegmentVisibility={onToggleSegmentVisibility}
      onToggleSegmentLock={onToggleSegmentLock}
      onToggleSegmentationVisibility={onToggleSegmentationVisibility}
      showDeleteSegment={true}
      segmentationConfig={{ initialConfig: segmentationConfiguration }}
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
        _setSegmentationConfiguration(selectedSegmentationId, 'renderInactiveSegmentations', value)
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
  );
}

PanelSegmentation.propTypes = {
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
