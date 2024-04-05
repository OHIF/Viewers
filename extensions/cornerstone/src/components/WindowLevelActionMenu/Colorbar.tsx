import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { SwitchButton } from '@ohif/ui';
import { StackViewport, VolumeViewport } from '@cornerstonejs/core';
import { ColorbarProps } from '../../types/Colorbar';
import { utilities } from '@cornerstonejs/core';

export function setViewportColorbar(
  viewportId,
  displaySets,
  commandsManager,
  serviceManager,
  colorbarOptions
) {
  const { cornerstoneViewportService } = serviceManager.services;
  const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

  const viewportInfo = cornerstoneViewportService.getViewportInfo(viewportId);
  const backgroundColor = viewportInfo.getViewportOptions().background;
  const isLight = backgroundColor ? utilities.isEqual(backgroundColor, [1, 1, 1]) : false;

  if (isLight) {
    colorbarOptions.ticks = {
      position: 'left',
      style: {
        font: '12px Arial',
        color: '#000000',
        maxNumTicks: 8,
        tickSize: 5,
        tickWidth: 1,
        labelMargin: 3,
      },
    };
  }

  const displaySetInstanceUIDs = [];

  if (viewport instanceof StackViewport) {
    displaySetInstanceUIDs.push(viewportId);
  }

  if (viewport instanceof VolumeViewport) {
    displaySets.forEach(ds => {
      displaySetInstanceUIDs.push(ds.displaySetInstanceUID);
    });
  }

  commandsManager.run({
    commandName: 'toggleViewportColorbar',
    commandOptions: {
      viewportId,
      options: colorbarOptions,
      displaySetInstanceUIDs,
    },
    context: 'CORNERSTONE',
  });
}

export function Colorbar({
  viewportId,
  displaySets,
  commandsManager,
  serviceManager,
  colorbarProperties,
}: ColorbarProps): ReactElement {
  const { colorbarService } = serviceManager.services;
  const {
    width: colorbarWidth,
    colorbarTickPosition,
    colorbarContainerPosition,
    colormaps,
    colorbarInitialColormap,
  } = colorbarProperties;
  const [showColorbar, setShowColorbar] = useState(colorbarService.hasColorbar(viewportId));

  const onSetColorbar = useCallback(() => {
    setViewportColorbar(viewportId, displaySets, commandsManager, serviceManager, {
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
    <div className="all-in-one-menu-item flex w-full justify-center">
      <SwitchButton
        label="Display Color bar"
        checked={showColorbar}
        onChange={() => {
          onSetColorbar();
        }}
      />
    </div>
  );
}
