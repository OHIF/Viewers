import React, { useEffect, useRef } from 'react';
import { utilities } from '@cornerstonejs/tools';
import { useSystem, useViewportRef, useViewportSize } from '@ohif/core';
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
  numColorbars: number;
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
  numColorbars,
}: ColorbarProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { servicesManager } = useSystem();
  const { customizationService } = servicesManager.services;
  const viewportElementRef = useViewportRef(viewportId);
  const { height } = useViewportSize(viewportId);

  useEffect(() => {
    if (!containerRef.current || !colormaps || !activeColormapName) {
      return;
    }

    const viewportElement = viewportElementRef?.current;

    if (!viewportElement) {
      return;
    }

    const colorbarCustomization = customizationService.getCustomization(
      'cornerstone.colorbar'
    ) as unknown as ColorbarCustomization;

    const positionTickStyles = colorbarCustomization?.positionTickStyles?.[position];

    let appropriateTickPosition = tickPosition;

    if (position === 'left' || position === 'right') {
      appropriateTickPosition = position === 'left' ? 'right' : 'left';
    } else {
      appropriateTickPosition = position === 'top' ? 'bottom' : 'top';
    }

    const csColorbar = new CornerstoneViewportColorbar({
      id: `Colorbar-${viewportId}-${displaySetInstanceUID}`,
      element: viewportElement,
      container: containerRef.current,
      colormaps: colormaps,
      activeColormapName: activeColormapName,
      volumeId,
      ticks: {
        position: appropriateTickPosition as ColorbarRangeTextPosition,
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

  if (!height) {
    return null;
  }

  return (
    <div
      id={`colorbar-container-${viewportId}-${displaySetInstanceUID}`}
      ref={containerRef}
      style={{
        position: 'relative',
        zIndex: 1000,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        pointerEvents: 'auto',
        minWidth: position === 'bottom' ? '100%' : '17px',
        minHeight: position === 'bottom' ? '20px' : numColorbars === 1 ? height / 2 : height / 4,
        ...positionStylesFromConfig,
      }}
    ></div>
  );
};

export default ViewportColorbar;
