import React, { ReactNode } from 'react';
import { cn } from '@ohif/ui-next';
import ViewportOrientationMenu from './ViewportOrientationMenu';
import { useViewportDisplaySets } from '../../hooks/useViewportDisplaySets';

export function ViewportOrientationMenuWrapper({
  viewportId,
  location,
}: withAppTypes<{
  viewportId: string;
  location: string;
}>): ReactNode {
  const { allDisplaySets } = useViewportDisplaySets(viewportId);

  if (!allDisplaySets.length) {
    return null;
  }
  return (
    <div className={cn('flex justify-end')}>
      <ViewportOrientationMenu
        location={location}
        viewportId={viewportId}
        displaySets={allDisplaySets}
      />
    </div>
  );
}
