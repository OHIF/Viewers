import React, { ReactNode } from 'react';
import { ViewportOrientationMenuWrapper } from './ViewportOrientationMenuWrapper';

export function getViewportOrientationMenu(
  props: withAppTypes<{
    viewportId: string;
    element: HTMLElement;
    location: string;
  }>
): ReactNode {
  return <ViewportOrientationMenuWrapper {...props} />;
}

export * from './ViewportOrientationMenu';
