import React from 'react';
import { useViewportActionCornersContext } from '../contextProviders/ViewportActionCornersProvider';
import { useSystem } from '@ohif/core';
import { useViewportGrid } from '@ohif/ui-next';

export type OHIFViewportActionCornersProps = {
  viewportId: string;
  /**
   * Number of action items to display per corner before collapsing
   * Default: 2
   */
  visibleItemsPerCorner?: number;
};

function OHIFViewportActionCorners({
  viewportId,
  visibleItemsPerCorner = 2,
}: OHIFViewportActionCornersProps) {
  const { servicesManager } = useSystem();
  const [viewportActionCornersState] = useViewportActionCornersContext();

  const [viewportGrid] = useViewportGrid();
  const isActiveViewport = viewportGrid.activeViewportId === viewportId;

  const ViewportActionCorners =
    servicesManager.services.customizationService.getCustomization('ui.viewportActionCorner');

  if (!viewportActionCornersState[viewportId]) {
    return null;
  }

  return (
    <ViewportActionCorners
      cornerComponents={viewportActionCornersState[viewportId]}
      visibleItemsPerCorner={visibleItemsPerCorner}
      isActiveViewport={isActiveViewport}
    />
  );
}

export default OHIFViewportActionCorners;
