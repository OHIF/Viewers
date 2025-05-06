import React from 'react';
import { useViewportActionCorners, useViewportGrid, ViewportActionCorners } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';

export type OHIFViewportActionCornersProps = {
  viewportId: string;
};

/**
 * A component that displays the action corners for a viewport using the provider-based approach
 * This replaces the current implementation that uses the cornerstone-specific context
 */
function OHIFViewportActionCorners({ viewportId }: OHIFViewportActionCornersProps) {
  const { servicesManager } = useSystem();
  const [state] = useViewportActionCorners();
  const [viewportGrid] = useViewportGrid();
  const isActiveViewport = viewportGrid.activeViewportId === viewportId;

  const { customizationService } = servicesManager.services;
  const ViewportActionCornersComponent =
    (customizationService.getCustomization(
      'ui.viewportActionCorner'
    ) as typeof ViewportActionCorners) || ViewportActionCorners;

  if (!state.components[viewportId]) {
    return null;
  }

  return <ViewportActionCornersComponent cornerComponents={state.components[viewportId]} />;
}

export default OHIFViewportActionCorners;
