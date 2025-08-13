import React, { useEffect, useRef, useMemo, memo } from 'react';
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

export const isHorizontal = (position: ColorbarPositionType): boolean =>
  position === 'top' || position === 'bottom';

/**
 * ViewportColorbar Component
 * A React wrapper for the cornerstone ViewportColorbar that adds a close button
 * positioned appropriately based on the colorbar position.
 */
const ViewportColorbar = memo(function ViewportColorbar({
  viewportId,
  displaySetInstanceUID,
  colormaps,
  activeColormapName,
  volumeId,
  position,
  tickPosition,
  tickStyles,
  numColorbars,
}: ColorbarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { servicesManager } = useSystem();
  const { customizationService } = servicesManager.services;
  const viewportElementRef = useViewportRef(viewportId);
  const { height, width } = useViewportSize(viewportId);

  // Memoize colorbar customization to prevent rerenders from unrelated customization changes
  const colorbarCustomization = useMemo(() => {
    return customizationService.getCustomization(
      'cornerstone.colorbar'
    ) as unknown as ColorbarCustomization;
  }, [customizationService]);

  const appropriateTickPosition = useMemo(() => {
    let tickPos = tickPosition;
    if (position === 'left' || position === 'right') {
      tickPos = position === 'left' ? 'right' : 'left';
    } else {
      tickPos = position === 'top' ? 'bottom' : 'top';
    }
    return tickPos;
  }, [position, tickPosition]);

  const positionTickStyles = useMemo(() => {
    return colorbarCustomization?.positionTickStyles?.[position];
  }, [colorbarCustomization, position]);

  const positionStylesFromConfig = useMemo(() => {
    return colorbarCustomization?.positionStyles?.[position] || {};
  }, [colorbarCustomization, position]);

  const mergedTickStyles = useMemo(() => {
    return {
      ...(colorbarCustomization?.tickStyles || {}),
      ...(positionTickStyles?.style || {}),
      ...(tickStyles || {}),
    };
  }, [colorbarCustomization, positionTickStyles, tickStyles]);

  const colorbarId = useMemo(() => {
    return `Colorbar-${viewportId}-${displaySetInstanceUID}`;
  }, [viewportId, displaySetInstanceUID]);

  useEffect(() => {
    if (!containerRef.current || !colormaps || !activeColormapName) {
      return;
    }

    const viewportElement = viewportElementRef?.current;

    if (!viewportElement || !colormaps?.length) {
      return;
    }

    // Using stable references from memoized values
    const csColorbar = new CornerstoneViewportColorbar({
      id: colorbarId,
      element: viewportElement,
      container: containerRef.current,
      colormaps: colormaps,
      activeColormapName: activeColormapName,
      volumeId,
      ticks: {
        position: appropriateTickPosition as ColorbarRangeTextPosition,
        style: mergedTickStyles,
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
    colorbarId,
    appropriateTickPosition,
    mergedTickStyles,
    viewportElementRef,
  ]);

  if (!height || !width) {
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
        minWidth: isHorizontal(position) ? width / 2.5 : '17px',
        minHeight: isHorizontal(position) ? '20px' : numColorbars === 1 ? height / 3 : height / 4,
        height: '1px', // sometimes flex items with min-height need a starting point for its height calculation
        ...positionStylesFromConfig,
      }}
    ></div>
  );
});

export default ViewportColorbar;
