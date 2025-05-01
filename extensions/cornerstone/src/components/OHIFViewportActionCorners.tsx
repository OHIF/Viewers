import React from 'react';
import { useViewportActionCornersContext } from '../contextProviders/ViewportActionCornersProvider';
import { useSystem } from '@ohif/core';

export type OHIFViewportActionCornersProps = {
  viewportId: string;
};

function OHIFViewportActionCorners({ viewportId }: OHIFViewportActionCornersProps) {
  const { servicesManager } = useSystem();
  const [viewportActionCornersState] = useViewportActionCornersContext();
  const ViewportActionCorners =
    servicesManager.services.customizationService.getCustomization('ui.viewportActionCorner');
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
