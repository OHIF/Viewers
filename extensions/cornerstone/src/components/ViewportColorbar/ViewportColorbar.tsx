import React, { useEffect, useState } from 'react';
import { utilities } from '@cornerstonejs/tools';
import { useSystem, useViewportElement, useViewportSize } from '@ohif/core';
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
  numColorbars: number;
};

export const isHorizontal = (position: ColorbarPositionType): boolean =>
  position === 'top' || position === 'bottom';

/**
 * ViewportColorbar Component
 * A React wrapper for the cornerstone ViewportColorbar that adds a close button
 * positioned appropriately based on the colorbar position.
 */
function ViewportColorbar({
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
  // State rather than a ref: the component renders null until useViewportSize
  // reports a size, so the container node does not exist on the first pass. A
  // ref would leave the effect below with nothing to attach to and no
  // dependency that changes once the node appears - it would only ever retry if
  // some unrelated dependency happened to churn. Storing the node in state makes
  // its arrival a dependency change, so the colorbar is created deterministically.
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const { servicesManager } = useSystem();
  const { customizationService } = servicesManager.services;
  const viewportElement = useViewportElement<HTMLDivElement>(viewportId);
  const { height, width } = useViewportSize(viewportId);

  // Memoize colorbar customization to prevent rerenders from unrelated customization changes
  const colorbarCustomization = customizationService.getCustomization(
    'cornerstone.colorbar'
  ) as unknown as ColorbarCustomization;

  let tickPos = tickPosition;
  if (position === 'left' || position === 'right') {
    tickPos = position === 'left' ? 'right' : 'left';
  } else {
    tickPos = position === 'top' ? 'bottom' : 'top';
  }
  const appropriateTickPosition = tickPos;

  const positionTickStyles = colorbarCustomization?.positionTickStyles?.[position];

  const positionStylesFromConfig = colorbarCustomization?.positionStyles?.[position] || {};

  const mergedTickStyles = {
    ...(colorbarCustomization?.tickStyles || {}),
    ...(positionTickStyles?.style || {}),
    ...(tickStyles || {}),
  };

  const colorbarId = `Colorbar-${viewportId}-${displaySetInstanceUID}`;

  useEffect(() => {
    if (!containerEl || !colormaps || !activeColormapName) {
      return;
    }

    if (!viewportElement || !colormaps?.length) {
      return;
    }

    // Using stable references from memoized values
    const csColorbar = new CornerstoneViewportColorbar({
      id: colorbarId,
      element: viewportElement,
      container: containerEl,
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
    viewportElement,
    containerEl,
  ]);

  if (!height || !width) {
    return null;
  }

  return (
    <div
      id={`colorbar-container-${viewportId}-${displaySetInstanceUID}`}
      ref={setContainerEl}
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
}

export default ViewportColorbar;
