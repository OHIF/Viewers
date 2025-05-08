import React, { useEffect, useState } from 'react';
import { useSystem } from '@ohif/core';
import AdvancedColorbarWithControls from './AdvancedColorbarWithControls';
import { ColorbarCustomization } from '../../types/Colorbar';
import type { ColorMapPreset } from '../../types/Colormap';
import ViewportColorbar from './ViewportColorbar';
import { deepMerge } from '@cornerstonejs/core/utilities';

type ViewportColorbarsContainerProps = {
  viewportId: string;
  viewportElementRef?: React.RefObject<HTMLDivElement>;
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
const ViewportColorbarsContainer = ({
  viewportId,
  viewportElementRef,
}: ViewportColorbarsContainerProps) => {
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

  const defaultPosition = colorbarCustomization?.colorbarContainerPosition;
  const defaultTickPosition = colorbarCustomization?.colorbarTickPosition;

  const position = colorbarCustomization?.colorbarContainerPosition || defaultPosition;
  const tickPosition = colorbarCustomization?.colorbarTickPosition || defaultTickPosition;
  const positionStyles = colorbarCustomization?.positionStyles;

  const positionStyle = positionStyles?.[position];

  const defaultPositionStyle =
    position !== 'bottom'
      ? {
          width: '20px',
          height: colorbars.length === 1 ? '55%' : '75%',
          top: '50%',
          transform: 'translateY(-50%)',
        }
      : {
          width: '100%',
          height: '20px',
        };

  const finalPositionStyle = deepMerge(defaultPositionStyle, positionStyle);

  return (
    <div
      className="absolute"
      style={{
        ...finalPositionStyle,
        pointerEvents: 'auto',
      }}
    >
      {position !== 'bottom' ? (
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
                viewportElementRef={viewportElementRef}
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
          viewportElementRef={viewportElementRef}
        />
      )}
    </div>
  );
};

export default ViewportColorbarsContainer;
