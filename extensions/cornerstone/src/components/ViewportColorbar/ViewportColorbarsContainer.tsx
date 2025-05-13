import React, { useEffect, useState } from 'react';
import { useSystem } from '@ohif/core';
import { ColorbarCustomization } from '../../types/Colorbar';
import type { ColorMapPreset } from '../../types/Colormap';
import ViewportColorbar from './ViewportColorbar';
import useViewportRendering from '../../hooks/useViewportRendering';

type ViewportColorbarsContainerProps = {
  viewportId: string;
  location: number;
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
const ViewportColorbarsContainer = ({ viewportId, location }: ViewportColorbarsContainerProps) => {
  const [colorbars, setColorbars] = useState<ColorbarData[]>([]);
  const { servicesManager } = useSystem();
  const { colorbarService, customizationService } = servicesManager.services;
  const { colorbarPosition: position } = useViewportRendering(viewportId, { location });

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

  const defaultTickPosition = colorbarCustomization?.colorbarTickPosition;

  const tickPosition = colorbarCustomization?.colorbarTickPosition || defaultTickPosition;

  return (
    <div
      style={{
        pointerEvents: 'auto',
      }}
    >
      <div
        className="flex h-full flex-col items-center justify-center"
        style={{ pointerEvents: 'auto' }}
      >
        {colorbars.map((colorbarInfo, index) => {
          const { colorbar, displaySetInstanceUID } = colorbarInfo;
          return (
            <ViewportColorbar
              key={`colorbar-${viewportId}-${displaySetInstanceUID}`}
              viewportId={viewportId}
              displaySetInstanceUID={displaySetInstanceUID}
              colormaps={colorbar.colormaps}
              activeColormapName={colorbar.activeColormapName}
              volumeId={colorbar.volumeId}
              position={position}
              tickPosition={tickPosition}
              tickStyles={colorbarCustomization?.tickStyles}
              numColorbars={colorbars.length}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ViewportColorbarsContainer;
