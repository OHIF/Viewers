import React, { ReactNode } from 'react';
import ViewportOrientationMenu from './ViewportOrientationMenu';
import { useViewportDisplaySets } from '../../hooks/useViewportDisplaySets';

export function ViewportOrientationMenuWrapper(
  props: withAppTypes<{
    viewportId: string;
    location: string;
    isOpen?: boolean;
    onOpen?: () => void;
    onClose?: () => void;
    iconSize?: number;
    disabled?: boolean;
  }>
): ReactNode {
  const { viewportId } = props;
  const { allDisplaySets } = useViewportDisplaySets(viewportId);

  if (!allDisplaySets.length) {
    return null;
  }

  return (
    <ViewportOrientationMenu
      {...props}
      displaySets={allDisplaySets}
    />
  );
}
