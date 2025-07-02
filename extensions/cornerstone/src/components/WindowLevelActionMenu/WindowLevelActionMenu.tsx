import React, { ReactElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AllInOneMenu } from '@ohif/ui-next';
import { Colormap } from './Colormap';
import { Colorbar } from './Colorbar';
import { WindowLevel } from './WindowLevel';
import { VolumeRenderingPresets } from './VolumeRenderingPresets';
import { VolumeRenderingOptions } from './VolumeRenderingOptions';
import { useViewportRendering } from '../../hooks/useViewportRendering';

export type WindowLevelActionMenuProps = {
  viewportId: string;
  element?: HTMLElement;
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
    <WindowLevelActionMenuContent
      viewportId={viewportId}
      align={align}
      side={side}
    />
  );
}

export function WindowLevelActionMenuContent({
  viewportId,
  align,
  side,
}: {
  viewportId: string;
  align?: string;
  side?: string;
}): ReactElement {
  const { t } = useTranslation('WindowLevelActionMenu');
  // Use a stable key for the menu to avoid infinite re-renders
  const menuKey = useMemo(() => `${viewportId}`, [viewportId]);

  const {
    is3DVolume,
    colorbarProperties,
    windowLevelPresets,
    volumeRenderingPresets,
    volumeRenderingQualityRange,
  } = useViewportRendering(viewportId);

  return (
    <AllInOneMenu.Menu
      key={menuKey}
      // the visibility is handled by the parent component
      isVisible={true}
      align={align}
      side={side}
    >
      <AllInOneMenu.ItemPanel>
        {!is3DVolume && <Colorbar viewportId={viewportId} />}

        {colorbarProperties?.colormaps && !is3DVolume && (
          <AllInOneMenu.SubMenu
            key="colorLUTPresets"
            itemLabel="Color LUT"
            itemIcon="icon-color-lut"
            className="flex h-[calc(100%-32px)] flex-col"
          >
            <Colormap viewportId={viewportId} />
          </AllInOneMenu.SubMenu>
        )}

        {windowLevelPresets?.length > 0 && !is3DVolume && (
          <AllInOneMenu.SubMenu
            key="windowLevelPresets"
            itemLabel={t('Modality Window Presets')}
            itemIcon="viewport-window-level"
          >
            <WindowLevel viewportId={viewportId} />
          </AllInOneMenu.SubMenu>
        )}

        {volumeRenderingPresets && is3DVolume && <VolumeRenderingPresets viewportId={viewportId} />}

        {volumeRenderingQualityRange && is3DVolume && (
          <AllInOneMenu.SubMenu itemLabel="Rendering Options">
            <VolumeRenderingOptions viewportId={viewportId} />
          </AllInOneMenu.SubMenu>
        )}
      </AllInOneMenu.ItemPanel>
    </AllInOneMenu.Menu>
  );
}
