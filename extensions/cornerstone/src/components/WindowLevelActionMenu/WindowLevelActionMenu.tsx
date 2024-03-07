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
import { VolumeQualityRange } from '../../types/ViewportPresets';
import { WindowLevel } from './WindowLevel';
import { VolumeRenderingPresets } from './VolumeRenderingPresets';
import { VolumeRenderingOptions } from './VolumeRenderingOptions';
import { ViewportPreset } from '../../types/ViewportPresets';
import { VolumeViewport3D } from '@cornerstonejs/core';

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
  volumeRenderingPresets: Array<ViewportPreset>;
  volumeQualityRange: VolumeQualityRange;
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
  volumeRenderingPresets,
  volumeQualityRange,
}: WindowLevelActionMenuProps): ReactElement {
  const {
    colormaps,
    colorbarContainerPosition,
    colorbarInitialColormap,
    colorbarTickPosition,
    width: colorbarWidth,
  } = colorbarProperties;
  const { colorbarService, cornerstoneViewportService } = serviceManager.services;
  const nonImageModalities = ['SR', 'SEG', 'SM', 'RTSTRUCT', 'RTPLAN', 'RTDOSE'];

  const { t } = useTranslation('WindowLevelActionMenu');

  const [viewportGrid] = useViewportGrid();
  const { activeViewportId } = viewportGrid;

  const [vpHeight, setVpHeight] = useState(element?.clientHeight);
  const [menuKey, setMenuKey] = useState(0);
  const [is3DVolume, setIs3DVolume] = useState(false);

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
    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
    if (viewport instanceof VolumeViewport3D) {
      setIs3DVolume(true);
    }
  }, [viewportId, cornerstoneViewportService, displaySets]);

  useEffect(() => {
    setMenuKey(menuKey + 1);
  }, [
    displaySets,
    viewportId,
    presets,
    volumeQualityRange,
    volumeRenderingPresets,
    is3DVolume,
    colorbarProperties,
  ]);

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
        {!is3DVolume && (
          <Colorbar
            viewportId={viewportId}
            displaySets={displaySets.filter(ds => !nonImageModalities.includes(ds.Modality))}
            commandsManager={commandsManager}
            serviceManager={serviceManager}
            colorbarProperties={colorbarProperties}
          />
        )}

        {colormaps && !is3DVolume && (
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

        {presets && !is3DVolume && (
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

        {volumeRenderingPresets && is3DVolume && (
          <VolumeRenderingPresets
            serviceManager={serviceManager}
            viewportId={viewportId}
            commandsManager={commandsManager}
            volumeRenderingPresets={volumeRenderingPresets}
          />
        )}

        {volumeQualityRange && is3DVolume && (
          <AllInOneMenu.SubMenu itemLabel="Rendering Options">
            <VolumeRenderingOptions
              viewportId={viewportId}
              commandsManager={commandsManager}
              volumeQualityRange={volumeQualityRange}
              serviceManager={serviceManager}
            />
          </AllInOneMenu.SubMenu>
        )}
      </AllInOneMenu.ItemPanel>
    </AllInOneMenu.IconMenu>
  );
}
