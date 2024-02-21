import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { SwitchButton } from '@ohif/ui';
import { StackViewport, VolumeViewport } from '@cornerstonejs/core';
import { CommandsManager, ServicesManager } from '@ohif/core';
import { ColorMapPreset } from './WindowLevelActionMenu';

export type ColorbarProps = {
  viewportId: string;
  commandsManager: CommandsManager;
  serviceManager: ServicesManager;
  displaySets: Array<any>;
  colorbarProperties: {
    width: string;
    colorbarTickPosition: string;
    colorbarContainerPosition: string;
    colormaps: Array<ColorMapPreset>;
    colorbarInitialColormap: string;
  };
};

export function setViewportColorbar(
  viewportId,
  displaySets,
  commandsManager,
  serviceManager,
  colorbarOptions
) {
  const { cornerstoneViewportService } = serviceManager.services;
  const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
  const displaySetInstanceUIDs = [];

  if (viewport instanceof StackViewport) {
    displaySetInstanceUIDs.push(viewportId);
  }

  if (viewport instanceof VolumeViewport) {
    displaySets.forEach(ds => {
      if (ds.Modality !== 'RTSTRUCT' && ds.Modality !== 'SEG') {
        displaySetInstanceUIDs.push(ds.displaySetInstanceUID);
      }
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
