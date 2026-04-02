import React, { ReactNode } from 'react';
import { useSystem } from '@ohif/core';
import { Enums } from '@cornerstonejs/core';
import ViewportOrientationMenu from './ViewportOrientationMenu';
import Viewport3DCompassMenu from './Viewport3DCompassMenu';
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
  const viewportInfo = servicesManager.services.cornerstoneViewportService.getViewportInfo(
    viewportId
  );
  const viewportType = viewportInfo?.getViewportType?.();
  const isVolume3D =
    viewportType === Enums.ViewportType.VOLUME_3D ||
    viewportType === 'volume3d';

  if (!viewportDisplaySets.length) {
    return null;
  }

  if (isVolume3D) {
    return <Viewport3DCompassMenu {...props} />;
  }

  return <ViewportOrientationMenu {...props} displaySets={viewportDisplaySets} />;
}
