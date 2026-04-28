import React, { ReactElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AllInOneMenu } from '@ohif/ui-next';
import { Colormap } from './Colormap';
import { Colorbar } from './Colorbar';
import { WindowLevel } from './WindowLevel';
import { VolumeRenderingPresets } from './VolumeRenderingPresets';
import { VolumeRenderingOptions } from './VolumeRenderingOptions';
import { useViewportRendering } from '../../hooks/useViewportRendering';
import i18n from 'i18next';

export type WindowLevelActionMenuProps = {
  viewportId: string;
  align?: 'start' | 'end' | 'center';
  side?: 'top' | 'bottom' | 'left' | 'right';
  onVisibilityChange?: (isVisible: boolean) => void;
};

export function WindowLevelActionMenu({
  viewportId,
  align,
  side,
  onVisibilityChange,
}: WindowLevelActionMenuProps): ReactElement {
  return (
    <WindowLevelActionMenuContent
      viewportId={viewportId}
      align={align}
      side={side}
      onVisibilityChange={onVisibilityChange}
    />
  );
}

export function WindowLevelActionMenuContent({
  viewportId,
  align,
  side,
  onVisibilityChange,
}: {
  viewportId: string;
  align?: string;
  side?: string;
  onVisibilityChange?: (isVisible: boolean) => void;
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
      backLabel={i18n.t('WindowLevelActionMenu:Back to Display Options')}
      onVisibilityChange={onVisibilityChange}
    >
      <AllInOneMenu.ItemPanel>
        {!is3DVolume && <Colorbar viewportId={viewportId} />}

        {colorbarProperties?.colormaps && !is3DVolume && (
          <AllInOneMenu.SubMenu
            key="colorLUTPresets"
            itemLabel={t('Color LUT')}
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
          <AllInOneMenu.SubMenu itemLabel={t('Rendering Options')}>
            <VolumeRenderingOptions viewportId={viewportId} />
          </AllInOneMenu.SubMenu>
        )}
      </AllInOneMenu.ItemPanel>
    </AllInOneMenu.Menu>
  );
}
