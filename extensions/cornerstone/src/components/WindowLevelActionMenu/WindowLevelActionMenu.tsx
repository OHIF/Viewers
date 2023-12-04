import React, { ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { AllInOneMenu, useViewportGrid } from '@ohif/ui';

export type WindowLevelPreset = {
  description: string;
  window: string;
  level: string;
};

export type WindowLevelActionMenuProps = {
  viewportId: string;
  viewportElem: HTMLElement;
  presets: Record<string, Array<WindowLevelPreset>>;
  onSetWindowLevel: (props) => void;
  verticalDirection: AllInOneMenu.VerticalDirection;
  horizontalDirection: AllInOneMenu.HorizontalDirection;
};

export function WindowLevelActionMenu({
  viewportId,
  viewportElem,
  presets,
  onSetWindowLevel,
  verticalDirection,
  horizontalDirection,
}: WindowLevelActionMenuProps): ReactElement {
  const { t } = useTranslation('WindowLevelActionMenu');

  const [viewportGrid] = useViewportGrid();
  const { activeViewportId } = viewportGrid;

  const [vpHeight, setVpHeight] = useState(viewportElem?.clientHeight);

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
      onVisibilityChange={() => setVpHeight(viewportElem.clientHeight)}
    >
      <AllInOneMenu.ItemPanel>
        {presets && (
          <AllInOneMenu.SubMenu
            key="windowLevelPresets"
            itemLabel={t('Modality Window Presets', { modality: Object.keys(presets)[0] })}
            headerComponent={
              <AllInOneMenu.HeaderItem>
                {t('Modality Presets', { modality: Object.keys(presets)[0] })}
              </AllInOneMenu.HeaderItem>
            }
          >
            <AllInOneMenu.ItemPanel>
              {Object.values(presets)[0].map((preset, index) => (
                <AllInOneMenu.Item
                  key={index}
                  label={preset.description}
                  secondaryLabel={`${preset.window} / ${preset.level}`}
                  onClick={() => onSetWindowLevel({ ...preset, viewportId })}
                ></AllInOneMenu.Item>
              ))}
            </AllInOneMenu.ItemPanel>
          </AllInOneMenu.SubMenu>
        )}
      </AllInOneMenu.ItemPanel>
    </AllInOneMenu.IconMenu>
  );
}
