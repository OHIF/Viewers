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
import { ColorbarRangeTextPosition } from '@cornerstonejs/tools/utilities/voi/colorbar/enums/ColorbarRangeTextPosition';

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

    const positionTickStyles = colorbarCustomization?.positionTickStyles?.[position];
    const csColorbar = new CornerstoneViewportColorbar({
      id: `Colorbar-${viewportId}-${displaySetInstanceUID}`,
      element: viewportElement,
      container: containerRef.current,
      colormaps: colormaps,
      activeColormapName: activeColormapName,
      volumeId,
      ticks: {
        position: tickPosition as ColorbarRangeTextPosition,
        style: {
          ...(colorbarCustomization?.tickStyles || {}),
          ...(positionTickStyles?.style || {}),
          ...(tickStyles || {}),
        },
      },
    });

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
    tickStyles,
    viewportElementRef,
    customizationService,
  ]);

  // Get position styles from customization service
  const colorbarCustomization = customizationService.getCustomization(
    'cornerstone.colorbar'
  ) as unknown as ColorbarCustomization;

  const positionStylesFromConfig = colorbarCustomization?.positionStyles?.[position] || {};

  return (
    <div
      id={`colorbar-container-${viewportId}-${displaySetInstanceUID}`}
      ref={containerRef}
      style={{
        width: position === 'bottom' ? '100%' : '20px',
        height: position === 'bottom' ? '20px' : '100%',
        position: 'relative',
        zIndex: 1000,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        pointerEvents: 'auto',
        ...positionStylesFromConfig,
      }}
    ></div>
  );
};

export default ViewportColorbar;
