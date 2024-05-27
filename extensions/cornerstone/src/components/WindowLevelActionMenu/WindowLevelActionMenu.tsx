import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { AllInOneMenu, useViewportGrid } from '@ohif/ui';
import { Colormap } from './Colormap';
import { Colorbar } from './Colorbar';
import { setViewportColorbar } from './Colorbar';
import { WindowLevelPreset } from '../../types/WindowLevel';
import { ColorbarProperties } from '../../types/Colorbar';
import { VolumeRenderingQualityRange } from '../../types/ViewportPresets';
import { WindowLevel } from './WindowLevel';
import { VolumeRenderingPresets } from './VolumeRenderingPresets';
import { VolumeRenderingOptions } from './VolumeRenderingOptions';
import { ViewportPreset } from '../../types/ViewportPresets';
import { VolumeViewport3D } from '@cornerstonejs/core';
import { utilities } from '@cornerstonejs/core';

export type WindowLevelActionMenuProps = {
  viewportId: string;
  element: HTMLElement;
  presets: Array<Record<string, Array<WindowLevelPreset>>>;
  verticalDirection: AllInOneMenu.VerticalDirection;
  horizontalDirection: AllInOneMenu.HorizontalDirection;
  colorbarProperties: ColorbarProperties;
  displaySets: Array<any>;
  volumeRenderingPresets: Array<ViewportPreset>;
  volumeRenderingQualityRange: VolumeRenderingQualityRange;
};

export function WindowLevelActionMenu({
  viewportId,
  element,
  presets,
  verticalDirection,
  horizontalDirection,
  commandsManager,
  servicesManager,
  colorbarProperties,
  displaySets,
  volumeRenderingPresets,
  volumeRenderingQualityRange,
}: withAppTypes<WindowLevelActionMenuProps>): ReactElement {
  const {
    colormaps,
    colorbarContainerPosition,
    colorbarInitialColormap,
    colorbarTickPosition,
    width: colorbarWidth,
  } = colorbarProperties;
  const { colorbarService, cornerstoneViewportService } = servicesManager.services;
  const viewportInfo = cornerstoneViewportService.getViewportInfo(viewportId);
  const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
  const backgroundColor = viewportInfo.getViewportOptions().background;
  const isLight = backgroundColor ? utilities.isEqual(backgroundColor, [1, 1, 1]) : false;

  const nonImageModalities = ['SR', 'SEG', 'SM', 'RTSTRUCT', 'RTPLAN', 'RTDOSE'];

  const { t } = useTranslation('WindowLevelActionMenu');

  const [viewportGrid] = useViewportGrid();
  const { activeViewportId } = viewportGrid;

  const [vpHeight, setVpHeight] = useState(element?.clientHeight);
  const [menuKey, setMenuKey] = useState(0);
  const [is3DVolume, setIs3DVolume] = useState(false);

  const onSetColorbar = useCallback(() => {
    setViewportColorbar(viewportId, displaySets, commandsManager, servicesManager, {
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
  }, [viewportId, displaySets, viewport]);

  useEffect(() => {
    setMenuKey(menuKey + 1);
    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
    if (viewport instanceof VolumeViewport3D) {
      setIs3DVolume(true);
    } else {
      setIs3DVolume(false);
    }
  }, [
    displaySets,
    viewportId,
    presets,
    volumeRenderingQualityRange,
    volumeRenderingPresets,
    colorbarProperties,
    activeViewportId,
    viewportGrid,
  ]);

  return (
    <AllInOneMenu.IconMenu
      icon="viewport-window-level"
      verticalDirection={verticalDirection}
      horizontalDirection={horizontalDirection}
      iconClassName={classNames(
        // Visible on hover and for the active viewport
        activeViewportId === viewportId ? 'visible' : 'invisible group-hover:visible',
        'flex shrink-0 cursor-pointer rounded active:text-white text-primary-light',
        isLight ? ' hover:bg-secondary-dark' : 'hover:bg-secondary-light/60'
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
            servicesManager={servicesManager}
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
              servicesManager={servicesManager}
            />
          </AllInOneMenu.SubMenu>
        )}

        {presets && presets.length > 0 && !is3DVolume && (
          <AllInOneMenu.SubMenu
            key="windowLevelPresets"
            itemLabel={t('Modality Window Presets')}
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
            servicesManager={servicesManager}
            viewportId={viewportId}
            commandsManager={commandsManager}
            volumeRenderingPresets={volumeRenderingPresets}
          />
        )}

        {volumeRenderingQualityRange && is3DVolume && (
          <AllInOneMenu.SubMenu itemLabel="Rendering Options">
            <VolumeRenderingOptions
              viewportId={viewportId}
              commandsManager={commandsManager}
              volumeRenderingQualityRange={volumeRenderingQualityRange}
              servicesManager={servicesManager}
            />
          </AllInOneMenu.SubMenu>
        )}
      </AllInOneMenu.ItemPanel>
    </AllInOneMenu.IconMenu>
  );
}
