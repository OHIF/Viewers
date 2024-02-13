import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { AllInOneMenu, SwitchButton, useViewportGrid } from '@ohif/ui';
import { CommandsManager } from '@ohif/core';
import { utilities } from '@cornerstonejs/tools';
import vtkColormaps from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction/ColorMaps';

const { ViewportColorbar } = utilities.voi.colorbar;
const { ColorbarRangeTextPosition } = utilities.voi.colorbar.Enums;
const colormaps = vtkColormaps.rgbPresetNames.map(presetName =>
  vtkColormaps.getPresetByName(presetName)
);
console.log('colormaps', colormaps);
export type WindowLevelPreset = {
  description: string;
  window: string;
  level: string;
};

export type WindowLevelActionMenuProps = {
  viewportId: string;
  element: HTMLElement;
  presets: Record<string, Array<WindowLevelPreset>>;
  verticalDirection: AllInOneMenu.VerticalDirection;
  horizontalDirection: AllInOneMenu.HorizontalDirection;
  commandsManager: CommandsManager;
};

export function WindowLevelActionMenu({
  viewportId,
  element,
  presets,
  verticalDirection,
  horizontalDirection,
  commandsManager,
}: WindowLevelActionMenuProps): ReactElement {
  const { t } = useTranslation('WindowLevelActionMenu');

  const [viewportGrid] = useViewportGrid();
  const { activeViewportId } = viewportGrid;

  const [vpHeight, setVpHeight] = useState(element?.clientHeight);

  useEffect(() => {
    if (element) {
      setVpHeight(element.clientHeight);
    }
  }, [element]);

  const onSetWindowLevel = useCallback(
    props => {
      commandsManager.run({
        commandName: 'setViewportWindowLevel',
        commandOptions: {
          ...props,
        },
        context: 'CORNERSTONE',
      });
    },
    [commandsManager]
  );

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
      onVisibilityChange={() => setVpHeight(element.clientHeight)}
    >
      <AllInOneMenu.ItemPanel>
        <div className="all-in-one-menu-item flex w-full justify-center">
          <SwitchButton
            label="Display Color bar"
            onChange={() => {
              const colorbarContainer = document.createElement('div');
              colorbarContainer.id = 'ctColorbarContainer';

              Object.assign(colorbarContainer.style, {
                position: 'absolute',
                boxSizing: 'border-box',
                border: 'solid 1px #555',
                cursor: 'initial',
                width: '2.5%',
                height: '50%',
                // align to the right
                right: '5%',
                // center vertically
                top: '50%',
                transform: 'translateY(-50%)',
              });

              const cornersonteViewportElement = element.querySelector(
                '[class^="viewport-element"]'
              );

              cornersonteViewportElement.appendChild(colorbarContainer);

              // Create and add the color bar to the DOM
              new ViewportColorbar({
                id: 'ctColorbar',
                element,
                colormaps,
                activeColormapName: 'Grayscale',
                container: colorbarContainer,
                ticks: {
                  position: ColorbarRangeTextPosition.Left,
                  style: {
                    font: '12px Arial',
                    color: '#fff',
                    maxNumTicks: 8,
                    tickSize: 5,
                    tickWidth: 1,
                    labelMargin: 3,
                  },
                },
              });
            }}
          />
        </div>
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
