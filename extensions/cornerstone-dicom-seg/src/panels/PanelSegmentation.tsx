import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { SegmentationGroupTable } from '@ohif/ui';
import callInputDialog from './callInputDialog';

import { useTranslation } from 'react-i18next';
import callColorPickerDialog from './callColorPickerDialog';

export default function PanelSegmentation({
  servicesManager,
  commandsManager,
}) {
  const {
    SegmentationService,
    UIDialogService,
    ViewportGridService,
    ToolGroupService,
    CornerstoneViewportService,
  } = servicesManager.services;

  const { t } = useTranslation('PanelSegmentation');
  const [selectedSegmentationId, setSelectedSegmentationId] = useState(null);
  const [
    initialSegmentationConfigurations,
    setInitialSegmentationConfigurations,
  ] = useState(SegmentationService.getConfiguration());

  const [segmentations, setSegmentations] = useState(() =>
    SegmentationService.getSegmentations()
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

  const onSegmentationClick = (segmentationId: string) => {
    SegmentationService.setActiveSegmentationForToolGroup(segmentationId);
  };

  const onSegmentationDelete = (segmentationId: string) => {
    SegmentationService.remove(segmentationId);
  };

  const getToolGroupId = () => {
    const { activeViewportIndex } = ViewportGridService.getState();

    const viewportInfo = CornerstoneViewportService.getViewportInfoByIndex(
      activeViewportIndex
    );
    const viewportId = viewportInfo.getViewportId();
    const toolGroup = ToolGroupService.getToolGroupForViewport(viewportId);
    return toolGroup.id;
  };

  const onSegmentClick = (segmentationId, segmentIndex) => {
    SegmentationService.setActiveSegmentForSegmentation(
      segmentationId,
      segmentIndex
    );

    const toolGroupId = getToolGroupId();
    // const toolGroupId =
    SegmentationService.setActiveSegmentationForToolGroup(
      segmentationId,
      toolGroupId
    );
    SegmentationService.jumpToSegmentCenter(
      segmentationId,
      segmentIndex,
      toolGroupId
    );
  };

  const onSegmentEdit = (segmentationId, segmentIndex) => {
    const segmentation = SegmentationService.getSegmentation(segmentationId);

    const segment = segmentation.segments[segmentIndex];
    const { label } = segment;

    callInputDialog(UIDialogService, label, (label, actionId) => {
      if (label === '') {
        return;
      }

      SegmentationService.setSegmentLabelForSegmentation(
        segmentationId,
        segmentIndex,
        label
      );
    });
  };

  const onSegmentationEdit = segmentationId => {
    const segmentation = SegmentationService.getSegmentation(segmentationId);
    const { label } = segmentation;

    callInputDialog(UIDialogService, label, (label, actionId) => {
      if (label === '') {
        return;
      }

      SegmentationService.addOrUpdateSegmentation(
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
    const segmentation = SegmentationService.getSegmentation(segmentationId);

    const segment = segmentation.segments[segmentIndex];
    const { color, opacity } = segment;

    // react-color expects rgb 0-255 and a 0-1.
    const rgbaColor = {
      r: color[0],
      g: color[1],
      b: color[2],
      a: opacity / 255.0,
    };

    const toolGroupIds = SegmentationService.getToolGroupsWithSegmentation(
      segmentationId
    );

    // todo: pick the first one
    const toolGroupId = toolGroupIds[0];

    callColorPickerDialog(
      UIDialogService,
      rgbaColor,
      (newRgbaColor, actionId) => {
        if (actionId === 'cancel') {
          return;
        }

        SegmentationService.setSegmentRGBAColorForSegmentation(
          segmentationId,
          segmentIndex,
          [
            newRgbaColor.r,
            newRgbaColor.g,
            newRgbaColor.b,
            newRgbaColor.a * 255,
          ],
          toolGroupId
        );
      }
    );
  };

  const onSegmentDelete = (segmentationId, segmentIndex) => {
    // SegmentationService.removeSegmentFromSegmentation(
    //   segmentationId,
    //   segmentIndex
    // );
    console.warn('not implemented yet');
  };

  const onToggleSegmentVisibility = (segmentationId, segmentIndex) => {
    const segmentation = SegmentationService.getSegmentation(segmentationId);
    const segmentInfo = segmentation.segments[segmentIndex];
    const isVisible = !segmentInfo.isVisible;

    SegmentationService.setSegmentVisibility(
      segmentationId,
      segmentIndex,
      isVisible
    );
  };

  const onToggleSegmentationVisibility = segmentationId => {
    SegmentationService.toggleSegmentationVisibility(segmentationId);
  };

  const setSegmentationConfiguration = useCallback(
    (segmentationId, key, value) => {
      SegmentationService.setConfiguration({
        segmentationId,
        [key]: value,
      });
    },
    [SegmentationService]
  );

  return (
    <div className="flex flex-col justify-between">
      {/* show segmentation table */}
      {segmentations?.length ? (
        <SegmentationGroupTable
          title={t('Segmentations')}
          amount={segmentations.length}
          showAddSegmentation={false}
          segmentations={segmentations}
          isMinimized={isMinimized}
          activeSegmentationId={selectedSegmentationId}
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
          segmentationConfig={{
            initialConfig: initialSegmentationConfigurations,
            usePercentage: true,
          }}
          setRenderOutline={value =>
            setSegmentationConfiguration(
              selectedSegmentationId,
              'renderOutline',
              value
            )
          }
          setOutlineOpacityActive={value =>
            setSegmentationConfiguration(
              selectedSegmentationId,
              'outlineOpacity',
              value
            )
          }
          setRenderFill={value =>
            setSegmentationConfiguration(
              selectedSegmentationId,
              'renderFill',
              value
            )
          }
          setRenderInactiveSegmentations={value =>
            setSegmentationConfiguration(
              selectedSegmentationId,
              'renderInactiveSegmentations',
              value
            )
          }
          setOutlineWidthActive={value =>
            setSegmentationConfiguration(
              selectedSegmentationId,
              'outlineWidthActive',
              value
            )
          }
          setFillAlpha={value =>
            setSegmentationConfiguration(
              selectedSegmentationId,
              'fillAlpha',
              value
            )
          }
          setFillAlphaInactive={value =>
            setSegmentationConfiguration(
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
      SegmentationService: PropTypes.shape({
        getSegmentation: PropTypes.func.isRequired,
        getSegmentations: PropTypes.func.isRequired,
        toggleSegmentationVisibility: PropTypes.func.isRequired,
        subscribe: PropTypes.func.isRequired,
        EVENTS: PropTypes.object.isRequired,
        VALUE_TYPES: PropTypes.object.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};
