import React, { ReactNode } from 'react';
import { useViewportGrid } from '@ohif/ui-next';
import { cn } from '@ohif/ui-next';
import ViewportOrientationMenu from './ViewportOrientationMenu';
import { useSystem } from '@ohif/core';

export function ViewportOrientationMenuWrapper({
  viewportId,
  location,
}: withAppTypes<{
  viewportId: string;
  element: HTMLElement;
  location: string;
}>): ReactNode {
  const [viewportGrid] = useViewportGrid();
  const isActiveViewport = viewportId === viewportGrid.activeViewportId;

  return (
    <div className={cn(isActiveViewport ? 'visible' : 'invisible group-hover/pane:visible')}>
      <ViewportOrientationMenu
        viewportId={viewportId}
        location={location}
      />
    </div>
  );
}
