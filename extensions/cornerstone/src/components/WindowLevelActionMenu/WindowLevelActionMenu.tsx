import React, { ReactElement, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AllInOneMenu } from '@ohif/ui-next';
import { useViewportGrid } from '@ohif/ui-next';
import { Colormap } from './Colormap';
import { Colorbar } from './Colorbar';
import { WindowLevel } from './WindowLevel';
import { VolumeRenderingPresets } from './VolumeRenderingPresets';
import { VolumeRenderingOptions } from './VolumeRenderingOptions';
import { WindowLevelProvider, useWindowLevel } from '../../hooks/useWindowLevel';

export type WindowLevelActionMenuProps = {
  viewportId: string;
  element: HTMLElement;
  align?: 'start' | 'end' | 'center';
  side?: 'top' | 'bottom' | 'left' | 'right';
};

export function WindowLevelActionMenu({
  viewportId,
  element,
  align,
  side,
}: WindowLevelActionMenuProps): ReactElement {
  return (
    <WindowLevelProvider
      viewportId={viewportId}
      element={element}
    >
      <WindowLevelActionMenuContent align={align} side={side} />
    </WindowLevelProvider>
  );
}

export function WindowLevelActionMenuContent({ align, side }: { align?: string; side?: string }): ReactElement {
  const { t } = useTranslation('WindowLevelActionMenu');
  const [viewportGrid] = useViewportGrid();
  const { activeViewportId } = viewportGrid;
  const [menuKey, setMenuKey] = useState(0);

  const {
    is3DVolume,
    displaySets,
    colorbarProperties,
    presets,
    volumeRenderingPresets,
    volumeRenderingQualityRange,
    viewportId
  } = useWindowLevel();

  // Force re-render on viewport or props changes
  useEffect(() => {
    setMenuKey(prevKey => prevKey + 1);
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
    <AllInOneMenu.Menu
      menuKey={menuKey}
      key={menuKey}
      // the visibility is handled by the parent component
      isVisible={true}
      align={align}
      side={side}
    >
      <AllInOneMenu.ItemPanel>
        {!is3DVolume && (
          <Colorbar />
        )}

        {colorbarProperties.colormaps && !is3DVolume && (
          <AllInOneMenu.SubMenu
            key="colorLUTPresets"
            itemLabel="Color LUT"
            itemIcon="icon-color-lut"
            className="flex h-[calc(100%-32px)] flex-col"
          >
            <Colormap />
          </AllInOneMenu.SubMenu>
        )}

        {presets && presets.length > 0 && !is3DVolume && (
          <AllInOneMenu.SubMenu
            key="windowLevelPresets"
            itemLabel={t('Modality Window Presets')}
            itemIcon="viewport-window-level"
          >
            <WindowLevel />
          </AllInOneMenu.SubMenu>
        )}

        {volumeRenderingPresets && is3DVolume && (
          <VolumeRenderingPresets />
        )}

        {volumeRenderingQualityRange && is3DVolume && (
          <AllInOneMenu.SubMenu itemLabel="Rendering Options">
            <VolumeRenderingOptions />
          </AllInOneMenu.SubMenu>
        )}
      </AllInOneMenu.ItemPanel>
    </AllInOneMenu.Menu>
  );
}
