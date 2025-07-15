import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ViewportActionButton } from '@ohif/ui-next';
import { Icons, Tooltip, TooltipTrigger, TooltipContent } from '@ohif/ui-next';
import { useSystem } from '@ohif/core/src';
import { useViewportDisplaySets } from '../../hooks/useViewportDisplaySets';
import { useMeasurementTracking } from '../../hooks/useMeasurementTracking';

/**
 * ModalityLoadBadge displays the status and actionable buttons for viewports containing
 * special displaySets (SR, SEG, RTSTRUCT) or when tracking measurements
 */
function ModalityLoadBadge({ viewportId }: { viewportId: string }) {
  const { commandsManager } = useSystem();
  const { t } = useTranslation('Common');
  const loadStr = t('LOAD');

  const { isTracked, isLocked } = useMeasurementTracking({ viewportId });

  const { backgroundDisplaySet } = useViewportDisplaySets(viewportId);

  const [specialDisplaySet, setSpecialDisplaySet] = useState(null);

  const allDisplaySets = useMemo(() => {
    return [backgroundDisplaySet].filter(Boolean);
  }, [backgroundDisplaySet]);

  useEffect(() => {
    const displaySet = allDisplaySets.find(ds => ds.isOverlayDisplaySet || ds?.Modality === 'SR');

    setSpecialDisplaySet(displaySet || null);
  }, [allDisplaySets]);

  const statusInfo = useMemo(() => {
    if (isTracked && !specialDisplaySet) {
      return {
        type: 'SR',
        isHydrated: true,
        isTracked,
        displaySet: null,
        tooltip: 'Currently tracking measurements in this viewport',
      };
    }

    if (!specialDisplaySet) {
      return {
        type: null,
      };
    }

    const type = specialDisplaySet.Modality;
    const isHydrated = specialDisplaySet.isHydrated || false;
    let tooltip = null;
    const isRehydratable = specialDisplaySet.isRehydratable || false;

    if (type === 'SEG') {
      tooltip = isHydrated
        ? 'This Segmentation is loaded in the segmentation panel'
        : 'Click LOAD to load segmentation.';
    } else if (type === 'RTSTRUCT') {
      tooltip = isHydrated
        ? 'This RTSTRUCT is loaded in the segmentation panel'
        : 'Click LOAD to load RTSTRUCT.';
    } else if (type === 'SR') {
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
      displaySet: specialDisplaySet,
      isRehydratable,
      tooltip,
    };
  }, [specialDisplaySet, loadStr, isLocked, isTracked]);

  // Nothing to show if there's no special display set type or tracking
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
    if (!statusInfo.isHydrated) {
      return (
        <div
          data-cy={`ModalityLoadBadge-${viewportId}`}
          className="flex h-6 cursor-default text-sm leading-6 text-white"
        >
          <div className="bg-customgray-100 flex min-w-[45px] items-center rounded-l-xl rounded-r p-1">
            <StatusIcon />
            <span className="ml-1">{statusInfo.type}</span>
          </div>
          {/* We don't show the load button for SRs because we handle it in the SR extension
          via the tracked measurement context that works with state machine, this is not a regression right now  */}
          {statusInfo.type !== 'SR' && (
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
          )}
        </div>
      );
    }

    return null;
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
