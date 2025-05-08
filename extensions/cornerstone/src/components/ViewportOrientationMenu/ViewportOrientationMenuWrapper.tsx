import React, { ReactNode } from 'react';
import ViewportOrientationMenu from './ViewportOrientationMenu';
import { useViewportDisplaySets } from '../../hooks/useViewportDisplaySets';

export function ViewportOrientationMenuWrapper({
  viewportId,
  location,
  isOpen = false,
  onOpen,
  onClose,
}: withAppTypes<{
  viewportId: string;
  location: string;
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  iconSize?: number;
}>): ReactNode {
  const { allDisplaySets } = useViewportDisplaySets(viewportId);

  if (!allDisplaySets.length) {
    return null;
  }

  return (
    <ViewportOrientationMenu
      location={location}
      viewportId={viewportId}
      displaySets={allDisplaySets}
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
    />
  );
}
