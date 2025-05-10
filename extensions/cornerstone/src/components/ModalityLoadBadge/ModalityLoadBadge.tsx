import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ViewportActionButton } from '@ohif/ui-next';
import { Icons, Tooltip, TooltipTrigger, TooltipContent } from '@ohif/ui-next';
import { useSystem } from '@ohif/core/src';
import { useViewportDisplaySets } from '../../hooks/useViewportDisplaySets';
import { BaseVolumeViewport } from '@cornerstonejs/core';

/**
 * ModalityLoadBadge displays the status and actionable buttons for viewports containing
 * special displaySets (SR, SEG, RTSTRUCT) or when tracking measurements
 */
function ModalityLoadBadge({ viewportId }: { viewportId: string }) {
  const { commandsManager, servicesManager } = useSystem();
  const { cornerstoneViewportService } = servicesManager.services;
  const { trackedMeasurementsService } = servicesManager.services as AppTypes.Services;
  const { t } = useTranslation('Common');
  const loadStr = t('LOAD');

  const { backgroundDisplaySet, overlayDisplaySets } = useViewportDisplaySets(viewportId);
  const [isTracked, setIsTracked] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const allDisplaySets = useMemo(() => {
    return [backgroundDisplaySet, ...overlayDisplaySets];
  }, [backgroundDisplaySet, overlayDisplaySets]);

  // Subscribe to tracked series changes using specific events
  useEffect(() => {
    if (!trackedMeasurementsService) {
      return;
    }

    // Initial state check
    setIsLocked(trackedMeasurementsService.isTrackingEnabled());

    if (backgroundDisplaySet?.SeriesInstanceUID) {
      setIsTracked(trackedMeasurementsService.isSeriesTracked(backgroundDisplaySet.SeriesInstanceUID));
    }

    // Subscribe to tracking enabled/disabled events for lock state
    const subscriptions = [
      // Global tracking enabled/disabled for lock state
      trackedMeasurementsService.subscribe(
        trackedMeasurementsService.EVENTS.TRACKING_ENABLED,
        () => setIsLocked(true)
      ),
      trackedMeasurementsService.subscribe(
        trackedMeasurementsService.EVENTS.TRACKING_DISABLED,
        () => setIsLocked(false)
      ),

      // Series-specific events for this viewport's tracked state
      trackedMeasurementsService.subscribe(
        trackedMeasurementsService.EVENTS.TRACKED_SERIES_CHANGED,
        ({ trackedSeries }) => {
          if (backgroundDisplaySet?.SeriesInstanceUID) {
            setIsTracked(trackedSeries.includes(backgroundDisplaySet.SeriesInstanceUID));
          }
        }
      )
    ];

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [trackedMeasurementsService, backgroundDisplaySet]);

  const displaySet = useMemo(() => {
    if (!allDisplaySets?.length) {
      return null;
    }
    return allDisplaySets.find(
      ds => ds.Modality === 'SEG' || ds.Modality === 'RTSTRUCT' || ds.Modality === 'SR'
    );
  }, [allDisplaySets]);

  const statusInfo = useMemo(() => {
    if (!displaySet) {
      return {
        type: null,
      };
    }

    // If we have tracking active but no special display set, show tracking status
    if (isTracked) {
      return {
        type: 'SR',
        isHydrated: true,
        isTracked,
        displaySet: null,
        tooltip: 'Currently tracking measurements in this viewport',
      };
    }

    let type = null;
    let isHydrated = false;
    let tooltip = null;
    let isRehydratable = false;

    if (displaySet.Modality === 'SEG') {
      type = 'SEG';
      isHydrated = displaySet.isHydrated || false;
      tooltip = isHydrated
        ? 'This Segmentation is loaded in the segmentation panel'
        : 'Click LOAD to load segmentation.';
    } else if (displaySet.Modality === 'RTSTRUCT') {
      type = 'RTSTRUCT';
      isHydrated = displaySet.isHydrated || false;
      tooltip = isHydrated
        ? 'This RTSTRUCT is loaded in the segmentation panel'
        : 'Click LOAD to load RTSTRUCT.';
    } else if (displaySet.Modality === 'SR') {
      type = 'SR';
      isHydrated = displaySet.isHydrated || false;
      isRehydratable = displaySet.isRehydratable || false;

      if (!isRehydratable) {
        tooltip = 'This structured report is not compatible with this application.';
      } else if (isRehydratable && isLocked) {
        tooltip =
          'This structured report is currently read-only because you are tracking measurements in another viewport.';
      } else {
        tooltip = `Click ${loadStr} to restore measurements.`;
      }
    }

    return {
      type,
      isHydrated,
      displaySet,
      isRehydratable,
      tooltip,
    };
  }, [displaySet, loadStr, isLocked, isTracked]);

  // let the track move forward
  if (!statusInfo.type && !isTracked) {
    return null;
  }

  const StatusIcon = () => {
    if (statusInfo.type === 'SR') {
      if (statusInfo.isRehydratable && !isLocked) {
        return (
          <Icons.ByName
            className="text-muted-foreground h-4 w-4"
            name="status-untracked"
          />
        );
      }

      if (statusInfo.isRehydratable && isLocked) {
        return (
          <Icons.ByName
            name="status-locked"
            className="h-4 w-4"
          />
        );
      } else {
        return (
          <Icons.ByName
            name="status-alert"
            className="h-4 w-4"
          />
        );
      }
    } else {
      return <Icons.StatusUntracked className="h-4 w-4" />;
    }
  };

  const StatusArea = () => {
    return (
      <>
        {!statusInfo.isHydrated && (
          <div className="flex h-6 cursor-default text-sm leading-6 text-white">
            <div className="bg-customgray-100 flex min-w-[45px] items-center rounded-l-xl rounded-r p-1">
              <StatusIcon />
              <span className="ml-1">{statusInfo.type}</span>
            </div>
            <ViewportActionButton
              onInteraction={() => {
                commandsManager.runCommand('hydrateSecondaryDisplaySet', {
                  displaySet: statusInfo.displaySet,
                  viewportId,
                });
              }}
            >
              {loadStr}
            </ViewportActionButton>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      {statusInfo.tooltip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <StatusArea />
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div>{statusInfo.tooltip}</div>
          </TooltipContent>
        </Tooltip>
      )}
      {!statusInfo.tooltip && <StatusArea />}
    </>
  );
}

export default ModalityLoadBadge;
