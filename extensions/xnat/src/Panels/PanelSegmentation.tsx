import { createReportAsync } from '@ohif/extension-default';
import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { SegmentationGroupTable } from '@ohif/ui';

import callInputDialog from '../utils/callInputDialog';
import callColorPickerDialog from './colorPickerDialog';
import { useTranslation } from 'react-i18next';

export default function PanelSegmentation({
  servicesManager,
  commandsManager,
  extensionManager,
  configuration,
}) {
  const { segmentationService, uiDialogService, viewportGridService } = servicesManager.services;

  const { t } = useTranslation('PanelSegmentation');

  const [selectedSegmentationId, setSelectedSegmentationId] = useState(null);
  const [segmentationConfiguration, setSegmentationConfiguration] = useState({});

  const [segmentations, setSegmentations] = useState(() => segmentationService.getSegmentations());

  useEffect(() => {
    console.log('PanelSegmentation Debug: segmentationService instance:', segmentationService);
    console.log('PanelSegmentation Debug: segmentationService.EVENTS object:', segmentationService?.EVENTS);

    // Ensure events object and specific events are available
    if (!segmentationService?.EVENTS) {
      console.error('PanelSegmentation Error: segmentationService.EVENTS is undefined!');
      return;
    }

    const added = segmentationService.EVENTS.SEGMENTATION_ADDED;
    const updated = segmentationService.EVENTS.SEGMENTATION_MODIFIED;
    const removed = segmentationService.EVENTS.SEGMENTATION_REMOVED;

    if (added === undefined || updated === undefined || removed === undefined) {
      console.error('PanelSegmentation Error: One or more critical segmentation events are undefined.', {
        SEGMENTATION_ADDED: added,
        SEGMENTATION_UPDATED: updated,
        SEGMENTATION_REMOVED: removed,
        allEvents: segmentationService.EVENTS,
      });
      // Depending on desired behavior, you might want to return or throw here
      // For now, we'll let it proceed to see if subscribe handles it, but it will likely fail.
    }

    const subscriptions = [];

    [added, updated, removed].forEach(evt => {
      // Defensive check: if an event string is somehow still undefined, skip it.
      if (typeof evt !== 'string') {
        console.error('PanelSegmentation Warning: Attempting to subscribe to an invalid event:', evt);
        return;
      }
      try {
        const { unsubscribe } = segmentationService.subscribe(evt, () => {
          const segmentations = segmentationService.getSegmentations();
          setSegmentations(segmentations);
        });
        subscriptions.push(unsubscribe);
      } catch (error) {
        console.error(`PanelSegmentation Error: Failed to subscribe to event "${evt}"`, error);
      }
    });

    return () => {
      subscriptions.forEach(unsub => {
        unsub();
      });
    };
  }, [segmentationService]);

  const getToolGroupIds = segmentationId => {
    const toolGroupIds = segmentationService.getViewportIdsWithSegmentation(segmentationId);

    return toolGroupIds;
  };

  const onSegmentationAdd = async () => {
    const { activeViewportId } = viewportGridService.getState();
    if (!activeViewportId) {
      console.error("PanelSegmentation Error: Cannot add segmentation, activeViewportId is undefined.");
      return;
    }
    commandsManager.runCommand('createLabelmapForViewport', { viewportId: activeViewportId });
  };

  const onSegmentationClick = (segmentationId: string) => {
    segmentationService.setActiveSegmentation(segmentationId);
  };

  const onSegmentationDelete = (segmentationId: string) => {
    segmentationService.remove(segmentationId);
  };

  const onSegmentAdd = segmentationId => {
    console.log('onSegmentAdd');
    const colors = [
      [0, 128, 0, 128],
      [0, 255, 0, 255],
      [255, 0, 0, 255],
      [0, 0, 255, 255],
      [128, 128, 255, 128],
    ];
    for (let i = 0; i < colors.length; i++) {
      const colorArray = colors[i];
      const [r, g, b, a] = colorArray;
      segmentationService.addSegment(segmentationId, { color: [r, g, b], opacity: a });
    }
  };

  const onSegmentClick = (segmentationId, segmentIndex) => {
    segmentationService.setActiveSegment(segmentationId, segmentIndex);

    const toolGroupIds = getToolGroupIds(segmentationId);

    toolGroupIds.forEach(toolGroupId => {
      // const toolGroupId =
      segmentationService.setActiveSegmentation(segmentationId, toolGroupId);
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
  };

  const _setSegmentationConfiguration = useCallback(
    (segmentationId, key, value) => {
      if (segmentationId) {
        segmentationService.setSpecificConfiguration(segmentationId, { [key]: value });
      } else {
        segmentationService.setGlobalConfiguration({ [key]: value });
      }
    },
    [segmentationService]
  );

  const onSegmentationDownload = segmentationId => {
    commandsManager.runCommand('downloadSegmentation', {
      segmentationId,
    });
  };

  const storeSegmentation = segmentationId => {
    const datasources = extensionManager.getActiveDataSource();

    const getReport = async () => {
      return await commandsManager.runCommand('storeSegmentation', {
        segmentationId,
        dataSource: datasources[0],
      });
    };

    createReportAsync({
      servicesManager,
      getReport,
      reportType: 'Segmentation',
    });
  };

  return (
    <>
      <div className="flex min-h-0 flex-auto select-none flex-col justify-between">
        <SegmentationGroupTable
          title={t('Segmentations')}
          segmentations={segmentations}
          disableEditing={configuration.disableEditing}
          activeSegmentationId={selectedSegmentationId || ''}
          onSegmentationAdd={onSegmentationAdd}
          onSegmentationClick={onSegmentationClick}
          onSegmentationDelete={onSegmentationDelete}
          onSegmentationDownload={onSegmentationDownload}
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
    </>
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
