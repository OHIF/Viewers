import React, { useEffect, useState } from 'react';
import { useSystem } from '@ohif/core';
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

/**
 * Container component that manages multiple colorbars for a viewport
 * It interacts with the colorbarService to get/set colorbar states
 */
const ViewportColorbarsContainer = ({ viewportId }: ViewportColorbarsContainerProps) => {
  // Define type for colorbar data
  type ColorbarData = {
    colorbar: {
      activeColormapName: string;
      colormaps: any[];
      volumeId?: string;
    };
    displaySetInstanceUID: string;
  };

  const [colorbars, setColorbars] = useState<ColorbarData[]>([]);
  const { servicesManager } = useSystem();
  const { colorbarService, customizationService } = servicesManager.services;

  useEffect(() => {
    // Initial setup of colorbars from colorbarService
    if (!colorbarService) {
      return;
    }

    const handleColorbarStateChanged = (event: {
      viewportId: string;
      displaySetInstanceUID?: string;
      changeType: string;
    }) => {
      if (event.viewportId === viewportId) {
        setColorbars(colorbarService.getViewportColorbar(viewportId) || []);
      }
    };

    // Subscribe to colorbar state changes
    const { unsubscribe } = colorbarService.subscribe(
      colorbarService.EVENTS.STATE_CHANGED,
      handleColorbarStateChanged
    );

    // Initialize with existing colorbars if any
    setColorbars(colorbarService.getViewportColorbar(viewportId) || []);

    return () => {
      unsubscribe();
    };
  }, [viewportId, colorbarService]);

  const handleClose = (displaySetInstanceUID: string): void => {
    if (displaySetInstanceUID) {
      colorbarService.removeColorbar(viewportId, displaySetInstanceUID);
    } else {
      colorbarService.removeColorbar(viewportId);
    }
  };

  // No colorbars to render
  if (!colorbars.length) {
    return null;
  }

  // Get customization settings
  const colorbarCustomization = customizationService.getCustomization(
    'cornerstone.colorbar'
  ) as unknown as ColorbarCustomization;

  // Determine default position and dimensions
  const defaultPosition: ColorbarPositionType =
    colorbarCustomization?.colorbarContainerPosition || 'right';
  const defaultTickPosition: TickPositionType =
    colorbarCustomization?.colorbarTickPosition || 'left';
  const dimensionConfig: DimensionConfigType = colorbarCustomization?.dimensionConfig || {
    bottomHeight: '20px',
    defaultVerticalWidth: '2.5%',
    defaultHorizontalHeight: '2.5%',
  };

  return (
    <>
      {colorbars.map((colorbarInfo, index) => {
        const { colorbar, displaySetInstanceUID } = colorbarInfo;
        const position = colorbarCustomization?.colorbarContainerPosition || defaultPosition;

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
            onClose={() => handleClose(displaySetInstanceUID)}
          />
        );
      })}
    </>
  );
};

export default ViewportColorbarsContainer;
