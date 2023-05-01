import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { SegmentationGroupTable } from '@ohif/ui';
import callInputDialog from './callInputDialog';

import { useTranslation } from 'react-i18next';

export default function PanelSegmentation({
  servicesManager,
  commandsManager,
}) {
  const { segmentationService, uiDialogService } = servicesManager.services;

  const { t } = useTranslation('PanelSegmentation');
  const [selectedSegmentationId, setSelectedSegmentationId] = useState(null);
  const [segmentationConfiguration, setSegmentationConfiguration] = useState(
    segmentationService.getConfiguration()
  );

  const [segmentations, setSegmentations] = useState(() =>
    segmentationService.getSegmentations()
  );

  const [isMinimized, setIsMinimized] = useState({});

  const onToggleMinimizeSegmentation = useCallback(
    id => {
      setIsMinimized(prevState => ({
        ...prevState,
        [id]: !prevState[id],
      }));
    },
    [setIsMinimized]
  );

  // Only expand the last segmentation added to the list and collapse the rest
  useEffect(() => {
    const lastSegmentationId = segmentations[segmentations.length - 1]?.id;
    if (lastSegmentationId) {
      setIsMinimized(prevState => ({
        ...prevState,
        [lastSegmentationId]: false,
      }));
    }
  }, [segmentations, setIsMinimized]);

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

  const onSegmentClick = (segmentationId, segmentIndex) => {
    segmentationService.setActiveSegmentForSegmentation(
      segmentationId,
      segmentIndex
    );

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

      segmentationService.setSegmentLabelForSegmentation(
        segmentationId,
        segmentIndex,
        label
      );
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
    // segmentationService.removeSegmentFromSegmentation(
    //   segmentationId,
    //   segmentIndex
    // );
    console.warn('not implemented yet');
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
    <div className="flex flex-col flex-auto min-h-0 justify-between mt-1">
      {/* show segmentation table */}
      {segmentations?.length ? (
        <SegmentationGroupTable
          title={t('Segmentations')}
          showAddSegmentation={false}
          segmentations={segmentations}
          isMinimized={isMinimized}
          activeSegmentationId={selectedSegmentationId || ''}
          onSegmentationClick={onSegmentationClick}
          onSegmentationDelete={onSegmentationDelete}
          onSegmentationEdit={onSegmentationEdit}
          onSegmentClick={onSegmentClick}
          onSegmentEdit={onSegmentEdit}
          onSegmentColorClick={onSegmentColorClick}
          onSegmentDelete={onSegmentDelete}
          onToggleSegmentVisibility={onToggleSegmentVisibility}
          onToggleSegmentationVisibility={onToggleSegmentationVisibility}
          onToggleMinimizeSegmentation={onToggleMinimizeSegmentation}
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
      ) : null}
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
