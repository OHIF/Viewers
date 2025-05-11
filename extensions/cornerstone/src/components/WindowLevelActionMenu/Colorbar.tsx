import React, { ReactElement } from 'react';
import { Switch } from '@ohif/ui-next';
import { ColorbarOptions } from '../../types/Colorbar';
import { utilities } from '@cornerstonejs/core';
import { useWindowLevel } from '../../hooks/useWindowLevel';

export function setViewportColorbar(
  viewportId: string,
  commandsManager: any,
  servicesManager: AppTypes.ServicesManager,
  colorbarOptions: Partial<ColorbarOptions>
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

export function Colorbar({ viewportId }: { viewportId?: string } = {}): ReactElement {
  const { hasColorbar, toggleColorbar } = useWindowLevel(viewportId);

  // Memoize toggle handler to avoid recreating it on each render
  const handleToggle = React.useCallback(() => {
    toggleColorbar();
  }, [viewportId, toggleColorbar]);

  // Only log on initial render or when values change
  React.useEffect(() => {}, [viewportId, hasColorbar]);

  return (
    <div className="hover:bg-accent flex h-8 w-full flex-shrink-0 cursor-pointer items-center px-2 text-base hover:rounded">
      <div className="flex w-7 flex-shrink-0 items-center justify-center"></div>
      <span
        className="flex-grow"
        onClick={handleToggle}
      >
        Display Color bar
      </span>
      <Switch
        className="ml-2 flex-shrink-0"
        checked={!!hasColorbar}
        onCheckedChange={handleToggle}
      />
    </div>
  );
}
