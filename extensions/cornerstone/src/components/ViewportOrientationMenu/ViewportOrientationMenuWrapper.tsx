import React, { ReactNode } from 'react';
import ViewportOrientationMenu from './ViewportOrientationMenu';
import { useViewportDisplaySets } from '../../hooks/useViewportDisplaySets';

export function ViewportOrientationMenuWrapper({
  viewportId,
  location,
  isOpen = false,
  onOpen,
  onClose,
  iconSize = 24,
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
  
  const handleOpenChange = (openState: boolean) => {
    if (openState) {
      onOpen?.();
    } else {
      onClose?.();
    }
  };

  return (
    <ViewportOrientationMenu
      location={location}
      viewportId={viewportId}
      displaySets={allDisplaySets}
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
      iconSize={iconSize}
    />
  );
}