import React from 'react';
import { useViewportActionCornersContext } from '../contextProviders/ViewportActionCornersProvider';
import { useServices } from '@ohif/ui';

export type OHIFViewportActionCornersProps = {
  viewportId: string;
};

function OHIFViewportActionCorners({ viewportId }: OHIFViewportActionCornersProps) {
  const { customizationService } = useServices();
  const [viewportActionCornersState] = useViewportActionCornersContext();
  const ViewportActionCorners = customizationService.getCustomization('ui.viewportActionCorner');
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
