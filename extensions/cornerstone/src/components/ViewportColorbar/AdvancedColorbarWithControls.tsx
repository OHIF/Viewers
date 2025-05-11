import React from 'react';
import { Button, Icons } from '@ohif/ui-next';
import { useViewportRef } from '@ohif/core';
import ViewportColorbar from './ViewportColorbar';
import {
  ColorbarCustomization,
  ColorbarPositionType,
  TickPositionType,
} from '../../types/Colorbar';
import type { ColorMapPreset } from '../../types/Colormap';
import { WindowLevelActionMenuWrapper } from '../WindowLevelActionMenu';
type ColorbarData = {
  colorbar: {
    activeColormapName: string;
    colormaps: ColorMapPreset[];
    volumeId?: string;
  };
  displaySetInstanceUID: string;
};

type AdvancedColorbarWithControlsProps = {
  viewportId: string;
  colorbars: ColorbarData[];
  position: string;
  tickPosition: string;
  colorbarCustomization: ColorbarCustomization;
  onClose: (displaySetInstanceUID?: string) => void;
};

/**
 * AdvancedColorbarWithControls Component
 * A specialized colorbar component with additional control buttons for advanced window level controls
 * This component handles the rendering portion of the ViewportColorbarsContainer
 */
const AdvancedColorbarWithControls = ({
  viewportId,
  colorbars,
  position,
  tickPosition,
  colorbarCustomization,
  ...rest
}: AdvancedColorbarWithControlsProps) => {
  // Get bottom position styles from customization
  const viewportElementRef = useViewportRef(viewportId);
  const positionStyles = colorbarCustomization?.positionStyles || {};
  const bottomPositionStyles = positionStyles.bottom || {};
  const heightStyle = bottomPositionStyles.height;

  return (
    <div className="mx-auto flex h-[20px] w-1/2 flex-row items-center justify-between">
      <div className="flex flex-shrink-0 flex-row">
        <WindowLevelActionMenuWrapper
          viewportId={viewportId}
          isOpen={true}
          location="bottom"
          abbas={true}
          {...rest}
        />
        <Button
          size="icon"
          variant="ghost"
          className="flex-shrink-0 p-0"
        >
          <Icons.ToolZoom />
        </Button>
      </div>

      <div
        className="mx-2"
        style={{ width: 'calc(75% - 16px)', height: heightStyle }}
      >
        {colorbars.map((colorbarInfo, index) => {
          const { colorbar, displaySetInstanceUID } = colorbarInfo;
          return (
            <ViewportColorbar
              key={`colorbar-${viewportId}-${displaySetInstanceUID}`}
              viewportId={viewportId}
              viewportElementRef={viewportElementRef}
              displaySetInstanceUID={displaySetInstanceUID}
              colormaps={colorbar.colormaps}
              activeColormapName={colorbar.activeColormapName}
              volumeId={colorbar.volumeId}
              position={position as ColorbarPositionType}
              tickPosition={tickPosition as TickPositionType}
              tickStyles={colorbarCustomization?.tickStyles}
            />
          );
        })}
      </div>

      <div className="flex flex-shrink-0 flex-row">
        <Button
          size="icon"
          variant="ghost"
          className="flex-shrink-0 p-0"
        >
          <Icons.Redo />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="flex-shrink-0 p-0"
        >
          <Icons.Pencil />
        </Button>
      </div>
    </div>
  );
};

export default AdvancedColorbarWithControls;
