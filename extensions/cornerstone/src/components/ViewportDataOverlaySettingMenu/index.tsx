import React, { ReactNode } from 'react';
import { AllInOneMenu } from '@ohif/ui-next';
import { ViewportSegmentationMenuWrapper } from './ViewportSegmentationMenuWrapper';

export function getViewportDataOverlaySettingsMenu(
  props: withAppTypes<{
    viewportId: string;
    element: HTMLElement;
  }>
): ReactNode {
  return <ViewportSegmentationMenuWrapper {...props} />;
}