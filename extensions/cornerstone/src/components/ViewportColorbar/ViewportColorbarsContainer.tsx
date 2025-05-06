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
    zIndex: 1000,
    padding: '4px 8px',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    borderRadius: '4px',
    background: 'rgba(220, 38, 38, 0.9)', // Red background for visibility
    color: 'white',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
    ...(position === 'bottom'
      ? { left: '10px', top: '-30px' }
      : position === 'right'
        ? { top: '10px', left: '-90px' }
        : position === 'left'
          ? { top: '10px', right: '-90px' }
          : { bottom: '-30px', left: '10px' }),
  };

  // Create container styles based on position
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: ['top', 'bottom'].includes(position) ? 'column' : 'row',
  };

  // Create toolbar styles based on position
  const toolbarStyles: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    padding: '4px',
    background: 'rgba(0, 0, 0, 0.7)',
    borderRadius: '4px',
    zIndex: 1000,
    ...(position === 'bottom'
      ? { marginBottom: '8px', justifyContent: 'flex-end' }
      : position === 'top'
        ? { marginTop: '8px', justifyContent: 'flex-end' }
        : position === 'right'
          ? { flexDirection: 'column', marginRight: '8px', alignItems: 'center' }
          : { flexDirection: 'column', marginLeft: '8px', alignItems: 'center' }),
  };

  return (
    <div>
      <div style={toolbarStyles}>
        <Button
          size="icon"
          variant="secondary"
          className="bg-gray-800 hover:bg-gray-700"
        >
          <Icons.Pencil className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="bg-gray-800 hover:bg-gray-700"
        >
          <Icons.ToolZoom className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="bg-gray-800 hover:bg-gray-700"
        >
          <Icons.Redo className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="destructive"
          onClick={() => handleClose()}
          className="bg-red-600 hover:bg-red-700"
        >
          <Icons.Close className="h-4 w-4" />
        </Button>
      </div>

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
    </div>
  );
};

export default ViewportColorbarsContainer;
