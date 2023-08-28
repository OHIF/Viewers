import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { SegmentationGroupTable, useViewportGrid } from '@ohif/ui';
import callInputDialog from './callInputDialog';
import { useTranslation } from 'react-i18next';

export default function PanelSegmentation({
  servicesManager,
  configuration,
  extensionManager,
}) {
  const {
    segmentationService,
    uiDialogService,
    uiNotificationService,
  } = servicesManager.services;
  const [viewportGrid, viewportGridService] = useViewportGrid();

  const { activeViewportIndex, viewports } = viewportGrid;

  const { t } = useTranslation('PanelSegmentation');
  const [selectedSegmentationId, setSelectedSegmentationId] = useState(null);
  const [segmentationConfiguration, setSegmentationConfiguration] = useState(
    segmentationService.getConfiguration()
  );

  const [segmentations, setSegmentations] = useState(() =>
    segmentationService.getSegmentations()
  );

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

  const onSegmentationAdd = () => {
    const activeViewport = viewports[activeViewportIndex];

    if (!activeViewport) {
      return;
    }

    const { displaySetInstanceUIDs } = activeViewport;

    // if more than one show notification that this is not supported
    if (displaySetInstanceUIDs.length > 1) {
      uiNotificationService.show({
        title: t('Segmentation'),
        message: t(
          'Segmentation is not supported for multiple display sets yet'
        ),
        type: 'error',
      });
      return;
    }

    const displaySetInstanceUID = displaySetInstanceUIDs[0];

    // identify if the viewport is a stack viewport then we need to convert
    // the viewport to a volume viewport first and mount on the same element
    // otherwise we are good

    const { viewportOptions } = activeViewport;

    if (viewportOptions.viewportType === 'stack') {
      // Todo: handle finding out other viewports in the grid
      // that require to change to volume viewport

      // Todo: add current imageIdIndex to the viewportOptions
      // so that we can restore it after changing to volume viewport
      viewportGridService.setDisplaySetsForViewports([
        {
          viewportIndex: activeViewportIndex,
          displaySetInstanceUIDs: [displaySetInstanceUID],
          viewportOptions: {
            // initialImageOptions: {
            //   index:
            // },
            viewportType: 'volume',
          },
        },
      ]);
    }

    // Todo: fix setTimout here
    setTimeout(async () => {
      const segmentationId = await segmentationService.createSegmentationForDisplaySet(
        displaySetInstanceUID,
        { label: 'New Segmentation' }
      );

      await segmentationService.addSegmentationRepresentationToToolGroup(
        activeViewport.viewportOptions.toolGroupId,
        segmentationId,
        true // hydrateSegmentation,
      );

      // Todo: handle other toolgroups than default
      segmentationService.addSegment(segmentationId, {
        properties: {
          label: 'Segment 1',
        },
      });
    }, 500);
  };

  const onSegmentationClick = (segmentationId: string) => {
    segmentationService.setActiveSegmentationForToolGroup(segmentationId);
  };

  const onSegmentationDelete = (segmentationId: string) => {
    segmentationService.remove(segmentationId);
  };

  const getToolGroupIds = segmentationId => {
    const toolGroupIds = segmentationService.getToolGroupIdsWithSegmentation(
      segmentationId
    );

    return toolGroupIds;
  };

  const onSegmentAdd = segmentationId => {
    segmentationService.addSegment(segmentationId);
  };

  const onSegmentClick = (segmentationId, segmentIndex) => {
    segmentationService.setActiveSegment(segmentationId, segmentIndex);

    const toolGroupIds = getToolGroupIds(segmentationId);

    toolGroupIds.forEach(toolGroupId => {
      // const toolGroupId =
      segmentationService.setActiveSegmentationForToolGroup(
        segmentationId,
        toolGroupId
      );
      segmentationService.jumpToSegmentCenter(
        segmentationId,
        segmentIndex,
        toolGroupId
      );
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
    // Todo: Implement color picker later
    return;
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
      segmentationService.setConfiguration({
        segmentationId,
        [key]: value,
      });
    },
    [segmentationService]
  );

  return (
    <div className="flex flex-col flex-auto min-h-0 justify-between mt-1 select-none">
      <SegmentationGroupTable
        title={t('Segmentations')}
        segmentations={segmentations}
        activeSegmentationId={selectedSegmentationId || ''}
        onSegmentationAdd={onSegmentationAdd}
        onSegmentationClick={onSegmentationClick}
        onSegmentationDelete={onSegmentationDelete}
        onSegmentationEdit={onSegmentationEdit}
        onSegmentClick={onSegmentClick}
        onSegmentEdit={onSegmentEdit}
        onSegmentAdd={onSegmentAdd}
        disableEditing={configuration.disableEditing}
        onSegmentColorClick={onSegmentColorClick}
        onSegmentDelete={onSegmentDelete}
        onToggleSegmentVisibility={onToggleSegmentVisibility}
        onToggleSegmentLock={onToggleSegmentLock}
        onToggleSegmentationVisibility={onToggleSegmentationVisibility}
        segmentationConfig={{ initialConfig: segmentationConfiguration }}
        setRenderOutline={value =>
          _setSegmentationConfiguration(
            selectedSegmentationId,
            'renderOutline',
            value
          )
        }
        setOutlineOpacityActive={value =>
          _setSegmentationConfiguration(
            selectedSegmentationId,
            'outlineOpacity',
            value
          )
        }
        setRenderFill={value =>
          _setSegmentationConfiguration(
            selectedSegmentationId,
            'renderFill',
            value
          )
        }
        setRenderInactiveSegmentations={value =>
          _setSegmentationConfiguration(
            selectedSegmentationId,
            'renderInactiveSegmentations',
            value
          )
        }
        setOutlineWidthActive={value =>
          _setSegmentationConfiguration(
            selectedSegmentationId,
            'outlineWidthActive',
            value
          )
        }
        setFillAlpha={value =>
          _setSegmentationConfiguration(
            selectedSegmentationId,
            'fillAlpha',
            value
          )
        }
        setFillAlphaInactive={value =>
          _setSegmentationConfiguration(
            selectedSegmentationId,
            'fillAlphaInactive',
            value
          )
        }
      />
    </div>
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
