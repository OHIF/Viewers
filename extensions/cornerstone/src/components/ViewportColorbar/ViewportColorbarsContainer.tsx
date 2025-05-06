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

  const position = colorbarCustomization?.colorbarContainerPosition || defaultPosition;

  return (
    <div
      className={cn(
        'relative',
        position === 'bottom' ? 'bottom-32 w-full' : 'bottom-32 w-1/2',
        position === 'top' || position === 'bottom' ? 'flex-col' : ''
      )}
    >
      <div className="mx-auto flex h-[20px] w-1/2 flex-row items-center justify-between">
        <div className="flex flex-shrink-0 flex-row">
          <Button
            size="icon"
            variant="secondary"
            className="h-[20px] w-[20px] flex-shrink-0 p-0"
          >
            <Icons.Pencil className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-[20px] w-[20px] flex-shrink-0 p-0"
          >
            <Icons.ToolZoom className="h-3 w-3" />
          </Button>
        </div>

        <div
          className="mx-2"
          style={{ width: 'calc(75% - 16px)' }}
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
                tickPosition={defaultTickPosition}
                tickStyles={colorbarCustomization?.tickStyles}
              />
            );
          })}
        </div>

        <div className="flex flex-shrink-0 flex-row">
          <Button
            size="icon"
            variant="secondary"
            className="h-[20px] w-[20px] flex-shrink-0 p-0"
          >
            <Icons.Redo className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            onClick={() => handleClose()}
            className="h-[20px] w-[20px] flex-shrink-0 p-0"
          >
            <Icons.Close className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ViewportColorbarsContainer;
