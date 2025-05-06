import React, { useEffect, useRef } from 'react';
import { utilities } from '@cornerstonejs/tools';
import { useSystem } from '@ohif/core';
import {
  ColorbarPositionType,
  TickPositionType,
  ColorbarCustomization,
  TickStyleType,
  ContainerStyleType,
} from '../../types/Colorbar';

const { ViewportColorbar: CornerstoneViewportColorbar } = utilities.voi.colorbar;

type ColorbarProps = {
  viewportId: string;
  displaySetInstanceUID: string;
  colormap?: any;
  colormaps: any[];
  activeColormapName: string;
  volumeId?: string;
  position: ColorbarPositionType;
  tickPosition: TickPositionType;
  tickStyles?: TickStyleType;
  containerStyles?: ContainerStyleType;
  dimensionStyles: Record<string, string | number>;
  viewportElementRef?: React.RefObject<HTMLDivElement>;
};

/**
 * ViewportColorbar Component
 * A React wrapper for the cornerstone ViewportColorbar that adds a close button
 * positioned appropriately based on the colorbar position.
 */
const ViewportColorbar = ({
  viewportId,
  displaySetInstanceUID,
  colormaps,
  activeColormapName,
  volumeId,
  position,
  tickPosition,
  tickStyles,
  viewportElementRef,
}: ColorbarProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { servicesManager } = useSystem();
  const { customizationService } = servicesManager.services;

  // Initialize and clean up the colorbar
  useEffect(() => {
    if (!containerRef.current || !colormaps || !activeColormapName) {
      return;
    }

    const viewportElement =
      viewportElementRef?.current ||
      (document.getElementById(`viewport-element-${viewportId}`) as HTMLDivElement);

    if (!viewportElement) {
      return;
    }

    const colorbarCustomization = customizationService.getCustomization(
      'cornerstone.colorbar'
    ) as unknown as ColorbarCustomization;

    // Get position-specific tick styles if available
    const positionTickStyles = colorbarCustomization?.positionTickStyles?.[position];

    // Create the cornerstone viewport colorbar
    const csColorbar = new CornerstoneViewportColorbar({
      id: `Colorbar-${viewportId}-${displaySetInstanceUID}`,
      element: viewportElement,
      container: containerRef.current,
      colormaps: colormaps,
      activeColormapName: activeColormapName,
      volumeId,
      ticks: {
        position: tickPosition,
        style: {
          ...(colorbarCustomization?.tickStyles || {}),
          ...(positionTickStyles?.style || {}),
          ...(tickStyles || {}),
        },
      },
    });

    // Clean up on unmount
    return () => {
      if (csColorbar) {
        csColorbar.destroy();
      }
    };
  }, [
    viewportId,
    displaySetInstanceUID,
    colormaps,
    activeColormapName,
    volumeId,
    position,
    tickPosition,
    viewportElementRef,
  ]);

  return (
    <div
      id={`colorbar-container-${viewportId}-${displaySetInstanceUID}`}
      ref={containerRef}
    ></div>
  );
};

export default ViewportColorbar;
