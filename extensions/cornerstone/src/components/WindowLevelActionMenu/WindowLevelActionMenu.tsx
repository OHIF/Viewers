import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { AllInOneMenu } from '@ohif/ui-next';
import { useViewportGrid } from '@ohif/ui-next';
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
import { useSystem } from '@ohif/core';

export type WindowLevelActionMenuProps = {
  viewportId: string;
  element: HTMLElement;
  presets: Array<Record<string, Array<WindowLevelPreset>>>;
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
  colorbarProperties,
  displaySets,
  volumeRenderingPresets,
  volumeRenderingQualityRange,
}: withAppTypes<WindowLevelActionMenuProps>): ReactElement {
  const { commandsManager, servicesManager } = useSystem();
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
  const backgroundColor = viewportInfo?.getViewportOptions().background;
  const isLight = backgroundColor ? utilities.isEqual(backgroundColor, [1, 1, 1]) : false;

  const { t } = useTranslation('WindowLevelActionMenu');

  const [viewportGrid] = useViewportGrid();
  const { activeViewportId } = viewportGrid;

  const [vpHeight, setVpHeight] = useState(element?.clientHeight);
  const [menuKey, setMenuKey] = useState(0);
  const [is3DVolume, setIs3DVolume] = useState(false);

  const onSetColorbar = useCallback(() => {
    setViewportColorbar(viewportId, commandsManager, servicesManager, {
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
        activeViewportId === viewportId ? 'visible' : 'invisible group-hover/pane:visible',
        'flex shrink-0 cursor-pointer rounded active:text-foreground text-highlight',
        isLight ? ' hover:bg-primary/30' : 'hover:bg-primary/30'
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
            displaySets={displaySets.filter(ds => ds.supportsWindowLevel === true)}
            colorbarProperties={colorbarProperties}
          />
        )}

        {colormaps && !is3DVolume && (
          <AllInOneMenu.SubMenu
            key="colorLUTPresets"
            itemLabel="Color LUT"
            itemIcon="icon-color-lut"
            className="flex h-[calc(100%-32px)] flex-col"
          >
            <Colormap
              className="flex h-full w-full flex-col"
              colormaps={colormaps}
              viewportId={viewportId}
              displaySets={displaySets.filter(ds => ds.supportsWindowLevel === true)}
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
              presets={presets}
            />
          </AllInOneMenu.SubMenu>
        )}

        {volumeRenderingPresets && is3DVolume && (
          <VolumeRenderingPresets
            viewportId={viewportId}
            volumeRenderingPresets={volumeRenderingPresets}
          />
        )}

        {volumeRenderingQualityRange && is3DVolume && (
          <AllInOneMenu.SubMenu itemLabel="Rendering Options">
            <VolumeRenderingOptions
              viewportId={viewportId}
              volumeRenderingQualityRange={volumeRenderingQualityRange}
            />
          </AllInOneMenu.SubMenu>
        )}
      </AllInOneMenu.ItemPanel>
    </AllInOneMenu.IconMenu>
  );
}
