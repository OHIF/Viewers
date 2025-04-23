import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { Switch } from '@ohif/ui-next';
import { StackViewport } from '@cornerstonejs/core';
import { ColorbarProps } from '../../types/Colorbar';
import { utilities } from '@cornerstonejs/core';
import { useSystem } from '@ohif/core';

export function setViewportColorbar(
  viewportId,
  commandsManager,
  servicesManager: AppTypes.ServicesManager,
  colorbarOptions
) {
  const { cornerstoneViewportService, viewportGridService } = servicesManager.services;
  const displaySetInstanceUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);

  const viewportInfo = cornerstoneViewportService.getViewportInfo(viewportId);
  const backgroundColor = viewportInfo.getViewportOptions().background;
  const isLight = backgroundColor ? utilities.isEqual(backgroundColor, [1, 1, 1]) : false;

  if (isLight) {
    colorbarOptions.ticks = {
      position: 'left',
      style: {
        font: '13px Inter',
        color: '#000000',
        maxNumTicks: 8,
        tickSize: 5,
        tickWidth: 1,
        labelMargin: 3,
      },
    };
  }

  commandsManager.run('toggleViewportColorbar', {
    viewportId,
    options: colorbarOptions,
    displaySetInstanceUIDs,
  });
}

export function Colorbar({
  viewportId,
  colorbarProperties,
}: withAppTypes<ColorbarProps>): ReactElement {
  const { servicesManager, commandsManager } = useSystem();
  const { colorbarService } = servicesManager.services;
  const {
    width: colorbarWidth,
    colorbarTickPosition,
    colorbarContainerPosition,
    colormaps,
    colorbarInitialColormap,
  } = colorbarProperties;
  const [showColorbar, setShowColorbar] = useState(colorbarService.hasColorbar(viewportId));

  const onSetColorbar = useCallback(() => {
    setViewportColorbar(viewportId, commandsManager, servicesManager, {
      viewportId,
      colormaps,
      ticks: {
        position: colorbarTickPosition,
      },
      width: colorbarWidth,
      position: colorbarContainerPosition,
      activeColormapName: colorbarInitialColormap,
    });
  }, [commandsManager]);

  useEffect(() => {
    const updateColorbarState = () => {
      setShowColorbar(colorbarService.hasColorbar(viewportId));
    };

    const { unsubscribe } = colorbarService.subscribe(
      colorbarService.EVENTS.STATE_CHANGED,
      updateColorbarState
    );

    return () => {
      unsubscribe();
    };
  }, [viewportId]);

  return (
    <div
      className="hover:bg-accent flex h-8 w-full flex-shrink-0 cursor-pointer items-center px-2 text-base hover:rounded"
      onClick={e => {
        e.stopPropagation();
        onSetColorbar();
      }}
    >
      <div className="flex w-7 flex-shrink-0 items-center justify-center"></div>
      <span className="flex-grow">Display Color bar</span>
      <Switch
        className="ml-2 flex-shrink-0"
        checked={showColorbar}
        onClick={e => {
          e.stopPropagation();
          onSetColorbar();
        }}
      />
    </div>
  );
}
