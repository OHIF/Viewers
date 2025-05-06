import React, { useEffect, useState } from 'react';
import { useSystem } from '@ohif/core';
import { Button, Icons } from '@ohif/ui-next';
import ViewportColorbar from './ViewportColorbar';
import {
  ColorbarPositionType,
  ColorbarCustomization,
  TickPositionType,
  DimensionConfigType,
} from '../../types/Colorbar';

type ViewportColorbarsContainerProps = {
  viewportId: string;
};

type ColorbarData = {
  colorbar: {
    activeColormapName: string;
    colormaps: any[];
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

  const closeButtonStyles: React.CSSProperties = {
    position: 'absolute',
    zIndex: 10,
    ...(position === 'bottom'
      ? { left: '-25px', top: '0', transform: 'translateY(-50%)' }
      : position === 'right'
        ? { top: '-25px', left: '0', transform: 'translateX(-50%)' }
        : position === 'left'
          ? { top: '-25px', right: '0', transform: 'translateX(50%)' }
          : { bottom: '-25px', right: '0', transform: 'translateX(50%)' }),
  };

  return (
    <div>
      {colorbars.map((colorbarInfo, index) => {
        const { colorbar, displaySetInstanceUID } = colorbarInfo;

        // Calculate dimension styles based on position
        const dimensions = {
          1: 50,
          2: 33,
        };
        const dimension = dimensions[colorbars.length] || 50 / colorbars.length;

        // Build dimension and position styles
        const dimensionStyles: Record<string, string | number> = {};
        const positionStyles = colorbarCustomization?.positionStyles?.[position] || {};

        if (['top', 'bottom'].includes(position)) {
          Object.assign(dimensionStyles, {
            width: `${dimension}%`,
            height:
              position === 'bottom'
                ? dimensionConfig.bottomHeight
                : dimensionConfig.defaultHorizontalHeight,
            left: `${(index + 1) * dimension}%`,
            transform: 'translateX(-50%)',
            ...positionStyles,
          });
        } else {
          Object.assign(dimensionStyles, {
            height: `${dimension}%`,
            width: dimensionConfig.defaultVerticalWidth,
            top: `${(index + 1) * dimension}%`,
            transform: 'translateY(-50%)',
            ...positionStyles,
          });
        }

        return (
          <ViewportColorbar
            key={`colorbar-${viewportId}-${displaySetInstanceUID}`}
            viewportId={viewportId}
            displaySetInstanceUID={displaySetInstanceUID}
            colormap={colorbar.colormap}
            colormaps={colorbar.colormaps}
            activeColormapName={colorbar.activeColormapName}
            volumeId={colorbar.volumeId}
            position={position}
            tickPosition={defaultTickPosition}
            tickStyles={colorbarCustomization?.tickStyles}
            containerStyles={colorbarCustomization?.containerStyles || {}}
            dimensionStyles={dimensionStyles}
          />
        );
      })}
      <div style={closeButtonStyles}>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => handleClose()}
          className="bg-red-500"
        >
          <Icons.Close className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ViewportColorbarsContainer;
