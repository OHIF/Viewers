import React, { useEffect, useState } from 'react';
import { useSystem } from '@ohif/core';
import { cn } from '@ohif/ui-next';
import AdvancedColorbarWithControls from './AdvancedColorbarWithControls';
import { ColorbarCustomization } from '../../types/Colorbar';
import type { ColorMapPreset } from '../../types/Colormap';
import ViewportColorbar from './ViewportColorbar';

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
  const tickPosition = colorbarCustomization?.colorbarTickPosition || defaultTickPosition;

  return (
    <div
      className={cn(
        'absolute',
        position === 'bottom' ? 'bottom-32 w-full' : '',
        position === 'left' ? 'left-5 top-1/2 -translate-y-1/2' : '',
        position === 'right' ? 'right-5 top-1/2 -translate-y-1/2' : ''
      )}
    >
      {position !== 'bottom' ? (
        <div className="flex h-full flex-col items-center justify-center">
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
              />
            );
          })}
        </div>
      ) : (
        <AdvancedColorbarWithControls
          viewportId={viewportId}
          colorbars={colorbars}
          position={position}
          tickPosition={defaultTickPosition}
          colorbarCustomization={colorbarCustomization}
          onClose={handleClose}
        />
      )}
    </div>
  );
};

export default ViewportColorbarsContainer;
