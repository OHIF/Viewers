import React, { ReactNode } from 'react';
import { ViewportDataOverlayMenuWrapper } from './ViewportDataOverlayMenuWrapper';

export function getViewportDataOverlaySettingsMenu(
  props: withAppTypes<{
    viewportId: string;
    element: HTMLElement;
  }>
): ReactNode {
  return <ViewportDataOverlayMenuWrapper {...props} />;
}
