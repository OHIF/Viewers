import React from 'react';
import { useSystem } from '@ohif/core';
import { Tooltip, TooltipTrigger, TooltipContent } from '@ohif/ui-next';
import { DECIMATION_OVERLAY_MESSAGE } from '../../utils/decimation/constants';

/**
 * AutoDecimationBadge shows a Lossy indicator in the viewport action corner
 * when auto or manual IJK decimation has been applied to a volume viewport.
 */
function AutoDecimationBadge({ viewportId }: { viewportId: string }) {
  const { servicesManager } = useSystem();
  const options = servicesManager?.services?.cornerstoneViewportService
    ?.getViewportInfo(viewportId)
    ?.getViewportOptions?.();
  const info = options?.autoDecimationInfo;
  const viewportType = options?.viewportType;
  const isVolume = viewportType === 'orthographic' || viewportType === 'volume3d';

  if (!info?.applied || !isVolume) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="inline-flex items-center rounded-full px-2 py-0.5"
          style={{
            backgroundColor: 'hsl(36 92% 10%)',
            color: 'hsl(43 96% 56%)',
            fontSize: 13,
          }}
          data-cy="auto-decimation-overlay"
        >
          {DECIMATION_OVERLAY_MESSAGE}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <div>{DECIMATION_OVERLAY_MESSAGE}</div>
      </TooltipContent>
    </Tooltip>
  );
}

export default AutoDecimationBadge;
