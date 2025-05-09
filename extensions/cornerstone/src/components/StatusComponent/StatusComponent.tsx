import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ViewportActionButton } from '@ohif/ui-next';
import { Icons, Tooltip, TooltipTrigger, TooltipContent } from '@ohif/ui-next';
import { useSystem } from '@ohif/core/src';
import { useViewportDisplaySets } from '../../hooks/useViewportDisplaySets';

/**
 * @returns
 */
function StatusComponent({ viewportId }: { viewportId: string }) {
  const { commandsManager } = useSystem();
  const { t } = useTranslation('Common');
  const loadStr = t('LOAD');

  const { allDisplaySets } = useViewportDisplaySets(viewportId);

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
        isHydrated: false,
        displaySet: null,
        tooltip: null,
      };
    }

    let type = null;
    let isHydrated = false;
    let tooltip = null;

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
      const isRehydratable = displaySet.isRehydratable || false;
      const isLocked = false;

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
      tooltip,
    };
  }, [displaySet, loadStr]);

  if (!statusInfo.type) {
    return null;
  }

  const StatusIcon = () => {
    if (statusInfo.isHydrated) {
      return <Icons.ByName name="status-alert" />;
    } else {
      return (
        <Icons.ByName
          className="text-muted-foreground h-4 w-4"
          name="status-untracked"
        />
      );
    }
  };

  const StatusArea = () => {
    return (
      <div className="flex h-6 cursor-default text-sm leading-6 text-white">
        <div className="bg-customgray-100 flex min-w-[45px] items-center rounded-l-xl rounded-r p-1">
          <StatusIcon />
          <span className="ml-1">{statusInfo.type}</span>
        </div>
        {!statusInfo.isHydrated && statusInfo.type && (
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

export default StatusComponent;
