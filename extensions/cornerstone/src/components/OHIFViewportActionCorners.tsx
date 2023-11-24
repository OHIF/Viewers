import React from 'react';
import { useViewportActionCornersContext } from '../contextProviders/ViewportActionCornersProvider';
import { ViewportActionCorners } from '@ohif/ui';

export type OHIFViewportActionCornersProps = {
  viewportId: string;
};

function OHIFViewportActionCorners({ viewportId }: OHIFViewportActionCornersProps) {
  const [viewportActionCornersState] = useViewportActionCornersContext();

  if (!viewportActionCornersState[viewportId]) {
    return null;
  }

  return (
    <ViewportActionCorners
      cornerComponents={viewportActionCornersState[viewportId]}
    ></ViewportActionCorners>
  );
}

export default OHIFViewportActionCorners;
