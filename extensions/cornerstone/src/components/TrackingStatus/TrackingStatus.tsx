import React from 'react';
import { Icons, Tooltip, TooltipTrigger, TooltipContent } from '@ohif/ui-next';
import { useMeasurementTracking } from '../../hooks/useMeasurementTracking';

/**
 * TrackingStatus displays an indicator icon for viewports that have
 * tracked measurements
 */
function TrackingStatus({ viewportId }: { viewportId: string }) {
  const { isTracked } = useMeasurementTracking({ viewportId });

  if (!isTracked) {
    return null;
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Icons.StatusTracking className="h-4 w-4" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div>Tracking</div>
        </TooltipContent>
      </Tooltip>
    </>
  );
}

export default TrackingStatus;
