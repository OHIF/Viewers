import React, { ReactNode } from 'react';
import { useSystem } from '@ohif/core';
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
  const { viewportDisplaySets } = useViewportDisplaySets(viewportId);

  const { servicesManager } = useSystem();
  const { cornerstoneViewportService } = servicesManager.services;
  const viewportInfo = cornerstoneViewportService.getViewportInfo(viewportId);
  const viewportOrientation = viewportInfo.getOrientation();

  if (!viewportDisplaySets.length) {
    return null;
  }

  return (
    <ViewportOrientationMenu
      {...props}
      viewportOrientation={viewportOrientation}
      displaySets={viewportDisplaySets}
    />
  );
}
