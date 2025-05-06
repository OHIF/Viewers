import React, { useEffect, useState } from 'react';
import { useSystem } from '@ohif/core';
import AdvancedColorbarWithControls from './AdvancedColorbarWithControls';
import { ColorbarCustomization } from '../../types/Colorbar';
import type { ColorMapPreset } from '../../types/Colormap';

type ViewportColorbarsContainerProps = {
  viewportId: string;
};

type ColorbarData = {
  colorbar: {
    activeColormapName: string;
    colormaps: ColorMapPreset[];
    volumeId?: string;
  };
  displaySetInstanceUID: string;
};

/**
 * Container component that manages multiple colorbars for a viewport
 * It interacts with the colorbarService to get/set colorbar states
 */
const ViewportColorbarsContainer = ({ viewportId }: ViewportColorbarsContainerProps) => {
  const [colorbars, setColorbars] = useState<ColorbarData[]>([]);
  const { servicesManager } = useSystem();
  const { colorbarService, customizationService } = servicesManager.services;

  useEffect(() => {
    setColorbars(colorbarService.getViewportColorbar(viewportId) || []);
  }, [viewportId, colorbarService]);

  useEffect(() => {
    const { unsubscribe } = colorbarService.subscribe(
      colorbarService.EVENTS.STATE_CHANGED,
      (event: { viewportId: string; displaySetInstanceUID?: string; changeType: string }) => {
        if (event.viewportId === viewportId) {
          setColorbars(colorbarService.getViewportColorbar(viewportId) || []);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [viewportId, colorbarService]);

  const handleClose = (displaySetInstanceUID?: string): void => {
    if (displaySetInstanceUID) {
      colorbarService.removeColorbar(viewportId, displaySetInstanceUID);
    } else {
      colorbarService.removeColorbar(viewportId);
    }
  };

  if (!colorbars.length) {
    return null;
  }

  const colorbarCustomization = customizationService.getCustomization(
    'cornerstone.colorbar'
  ) as unknown as ColorbarCustomization;

  const defaultPosition = colorbarCustomization?.colorbarContainerPosition || 'right';
  const defaultTickPosition = colorbarCustomization?.colorbarTickPosition || 'left';

  const position = colorbarCustomization?.colorbarContainerPosition || defaultPosition;

  return (
    <AdvancedColorbarWithControls
      viewportId={viewportId}
      colorbars={colorbars}
      position={position}
      tickPosition={defaultTickPosition}
      colorbarCustomization={colorbarCustomization}
      onClose={handleClose}
    />
  );
};

export default ViewportColorbarsContainer;
