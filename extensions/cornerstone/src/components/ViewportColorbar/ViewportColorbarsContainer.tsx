import React, { useEffect, useState, useMemo, memo, useCallback } from 'react';
import { useSystem } from '@ohif/core';
import { ColorbarCustomization } from '../../types/Colorbar';
import type { ColorMapPreset } from '../../types/Colormap';
import ViewportColorbar, { isHorizontal } from './ViewportColorbar';
import useViewportRendering from '../../hooks/useViewportRendering';
import { useViewportDisplaySets } from '../../hooks/useViewportDisplaySets';
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
const ViewportColorbarsContainer = memo(function ViewportColorbarsContainer({
  viewportId,
  location,
}: ViewportColorbarsContainerProps) {
  const [colorbars, setColorbars] = useState<ColorbarData[]>([]);
  const { servicesManager } = useSystem();
  const { colorbarService, customizationService, displaySetService } = servicesManager.services;
  const { viewportDisplaySets, backgroundDisplaySet, foregroundDisplaySets } =
    useViewportDisplaySets(viewportId);
  const { colorbarPosition: position, opacity } = useViewportRendering(viewportId, {
    location,
  });

  // Memoize the customization to prevent recomputation
  const colorbarCustomization = useMemo(() => {
    return customizationService.getCustomization(
      'cornerstone.colorbar'
    ) as unknown as ColorbarCustomization;
  }, [customizationService]);

  // Memoize tick position
  const tickPosition = useMemo(() => {
    const defaultTickPosition = colorbarCustomization?.colorbarTickPosition;
    return colorbarCustomization?.colorbarTickPosition || defaultTickPosition;
  }, [colorbarCustomization]);

  // Initial load of colorbars
  useEffect(() => {
    setColorbars(colorbarService.getViewportColorbar(viewportId) || []);
  }, [viewportId, colorbarService]);

  // Subscribe to colorbar state changes
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

  if (!colorbars.length) {
    return null;
  }

  const isSingleViewport = viewportDisplaySets.length === 1;
  const showFullList = isSingleViewport || !isHorizontal(position);

  const colorbarsToUse = showFullList
    ? colorbars
    : colorbars.filter(({ displaySetInstanceUID }) => {
        const { displaySetInstanceUID: dsUID } =
          displaySetService.getDisplaySetByUID(displaySetInstanceUID) ?? {};

        const targetUID =
          opacity === 0 || opacity == null
            ? backgroundDisplaySet?.displaySetInstanceUID
            : foregroundDisplaySets[0].displaySetInstanceUID;

        return dsUID === targetUID;
      });

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
        {colorbarsToUse.map(colorbarInfo => {
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
});

export default ViewportColorbarsContainer;
