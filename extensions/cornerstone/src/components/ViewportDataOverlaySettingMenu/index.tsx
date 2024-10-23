import React, { ReactNode } from 'react';
import { ViewportSegmentationMenuWrapper } from './ViewportSegmentationMenuWrapper';

export function getViewportDataOverlaySettingsMenu(
  props: withAppTypes<{
    viewportId: string;
    element: HTMLElement;
  }>
): ReactNode {
  return <ViewportSegmentationMenuWrapper {...props} />;
}
