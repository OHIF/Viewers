import React, { ReactNode } from 'react';
import { useSystem } from '@ohif/core';
import ViewportOrientationMenu from './ViewportOrientationMenu';
import Viewport3DCompassMenu from './Viewport3DCompassMenu';
import { useViewportDisplaySets } from '../../hooks/useViewportDisplaySets';
import { getViewportAdapter } from '../../services/ViewportService/adapter';

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

  if (!viewportDisplaySets.length) {
    return null;
  }

  const viewport = servicesManager.services.cornerstoneViewportService.getCornerstoneViewport(
    viewportId
  );
  if (viewport && getViewportAdapter(viewport).getShape() === 'volume3d') {
    return <Viewport3DCompassMenu {...props} />;
  }

  return (
    <ViewportOrientationMenu
      {...props}
      displaySets={viewportDisplaySets}
    />
  );
}
