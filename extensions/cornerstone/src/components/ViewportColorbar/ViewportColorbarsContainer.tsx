import React, { useEffect, useState } from 'react';
import { useSystem } from '@ohif/core';
import { Button, Icons, cn } from '@ohif/ui-next';
import ViewportColorbar from './ViewportColorbar';
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
  const dimensionConfig = colorbarCustomization?.dimensionConfig || {
    bottomHeight: '20px',
    defaultVerticalWidth: '2.5%',
    defaultHorizontalHeight: '2.5%',
  };

  const position = colorbarCustomization?.colorbarContainerPosition || defaultPosition;

  return (
    <div
      className={cn(
        'relative bottom-32 w-1/2',
        (position === 'top' || position === 'bottom') && 'flex-col'
      )}
    >
      <div className="flex flex-row bg-green-400">
        <Button
          size="icon"
          variant="secondary"
        >
          <Icons.Pencil className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
        >
          <Icons.ToolZoom className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
        >
          <Icons.Redo className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          onClick={() => handleClose()}
        >
          <Icons.Close className="h-4 w-4" />
        </Button>
        <div className="w-full">
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
                tickPosition={defaultTickPosition}
                tickStyles={colorbarCustomization?.tickStyles}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ViewportColorbarsContainer;
