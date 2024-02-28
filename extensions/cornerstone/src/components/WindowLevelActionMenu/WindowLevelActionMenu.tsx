import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { AllInOneMenu, useViewportGrid } from '@ohif/ui';
import { CommandsManager, ServicesManager } from '@ohif/core';
import { Colormap } from './Colormap';
import { Colorbar } from './Colorbar';
import { setViewportColorbar } from './Colorbar';
import { WindowLevelPreset } from '../../types/WindowLevel';
import { ColorbarProperties } from '../../types/Colorbar';
import { WindowLevel } from './WindowLevel';

export type WindowLevelActionMenuProps = {
  viewportId: string;
  element: HTMLElement;
  presets: Record<string, Array<WindowLevelPreset>>;
  verticalDirection: AllInOneMenu.VerticalDirection;
  horizontalDirection: AllInOneMenu.HorizontalDirection;
  commandsManager: CommandsManager;
  serviceManager: ServicesManager;
  colorbarProperties: ColorbarProperties;
  displaySets: Array<any>;
};

export function WindowLevelActionMenu({
  viewportId,
  element,
  presets,
  verticalDirection,
  horizontalDirection,
  commandsManager,
  serviceManager,
  colorbarProperties,
  displaySets,
}: WindowLevelActionMenuProps): ReactElement {
  const {
    colormaps,
    colorbarContainerPosition,
    colorbarInitialColormap,
    colorbarTickPosition,
    width: colorbarWidth,
  } = colorbarProperties;
  const { colorbarService } = serviceManager.services;
  const nonImageModalities = ['SR', 'SEG', 'SM', 'RTSTRUCT', 'RTPLAN', 'RTDOSE'];

  const { t } = useTranslation('WindowLevelActionMenu');

  const [viewportGrid] = useViewportGrid();
  const { activeViewportId } = viewportGrid;

  const [vpHeight, setVpHeight] = useState(element?.clientHeight);
  const [menuKey, setMenuKey] = useState(0);

  const onSetColorbar = useCallback(() => {
    setViewportColorbar(viewportId, displaySets, commandsManager, serviceManager, {
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
    const newVpHeight = element?.clientHeight;
    if (vpHeight !== newVpHeight) {
      setVpHeight(newVpHeight);
    }
  }, [element, vpHeight]);

  useEffect(() => {
    if (!colorbarService.hasColorbar(viewportId)) {
      return;
    }
    window.setTimeout(() => {
      colorbarService.removeColorbar(viewportId);
      onSetColorbar();
    }, 0);
  }, [viewportId]);

  useEffect(() => {
    setMenuKey(menuKey + 1);
  }, [displaySets, viewportId, presets]);

  return (
    <AllInOneMenu.IconMenu
      icon="viewport-window-level"
      verticalDirection={verticalDirection}
      horizontalDirection={horizontalDirection}
      iconClassName={classNames(
        // Visible on hover and for the active viewport
        activeViewportId === viewportId ? 'visible' : 'invisible group-hover:visible',
        'text-primary-light hover:bg-secondary-light/60 flex shrink-0 cursor-pointer rounded active:text-white'
      )}
      menuStyle={{ maxHeight: vpHeight - 32, minWidth: 218 }}
      onVisibilityChange={() => {
        setVpHeight(element.clientHeight);
      }}
      menuKey={menuKey}
    >
      <AllInOneMenu.ItemPanel>
        <Colorbar
          viewportId={viewportId}
          displaySets={displaySets.filter(ds => !nonImageModalities.includes(ds.Modality))}
          commandsManager={commandsManager}
          serviceManager={serviceManager}
          colorbarProperties={colorbarProperties}
        />
        {colormaps && (
          <AllInOneMenu.SubMenu
            key="colorLUTPresets"
            itemLabel="Color LUT"
            itemIcon="icon-color-lut"
          >
            <Colormap
              colormaps={colormaps}
              viewportId={viewportId}
              displaySets={displaySets.filter(ds => !nonImageModalities.includes(ds.Modality))}
              commandsManager={commandsManager}
              serviceManager={serviceManager}
            />
          </AllInOneMenu.SubMenu>
        )}

        {presets && (
          <AllInOneMenu.SubMenu
            key="windowLevelPresets"
            itemLabel={t('Modality Window Presets', { modality: Object.keys(presets)[0] })}
            itemIcon="viewport-window-level"
          >
            <WindowLevel
              viewportId={viewportId}
              commandsManager={commandsManager}
              presets={presets}
            />
          </AllInOneMenu.SubMenu>
        )}
      </AllInOneMenu.ItemPanel>
    </AllInOneMenu.IconMenu>
  );
}
