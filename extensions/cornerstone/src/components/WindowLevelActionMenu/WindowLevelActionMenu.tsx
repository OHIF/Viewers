import React, { ReactElement, useCallback, useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { AllInOneMenu, SwitchButton, useViewportGrid } from '@ohif/ui';
import { CommandsManager } from '@ohif/core';

export type WindowLevelPreset = {
  description: string;
  window: string;
  level: string;
};

export type ColorMapPreset = {
  ColorSpace;
  description: string;
  RGBPoints;
  Name;
};

export type WindowLevelActionMenuProps = {
  viewportId: string;
  element: HTMLElement;
  presets: Record<string, Array<WindowLevelPreset>>;
  verticalDirection: AllInOneMenu.VerticalDirection;
  horizontalDirection: AllInOneMenu.HorizontalDirection;
  commandsManager: CommandsManager;
  colormaps: Array<ColorMapPreset>;
  colorbarService: any;
  colorbarWidth: string;
  colorbarContainerPosition: string;
  coloarbarTickPosition: string;
  coloarbarInitialColormap: string;
  cornerstoneViewportService: any;
};

export function WindowLevelActionMenu({
  viewportId,
  element,
  presets,
  verticalDirection,
  horizontalDirection,
  commandsManager,
  colormaps,
  colorbarService,
  colorbarWidth,
  colorbarContainerPosition,
  coloarbarTickPosition,
  coloarbarInitialColormap,
  cornerstoneViewportService,
}: WindowLevelActionMenuProps): ReactElement {
  const { t } = useTranslation('WindowLevelActionMenu');

  const [viewportGrid] = useViewportGrid();
  const { activeViewportId } = viewportGrid;

  const [vpHeight, setVpHeight] = useState(element?.clientHeight);
  const [colorbarState, setColorbarState] = useState(colorbarService.isColorbarToggled(viewportId));
  const [showPreview, setShowPreview] = useState(false);
  const [prePreviewColormap, setPrePreviewColormap] = useState(null);
  const showPreviewRef = useRef(showPreview);
  showPreviewRef.current = showPreview;
  const prePreviewColormapRef = useRef(prePreviewColormap);
  prePreviewColormapRef.current = prePreviewColormap;

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

  const onSetColorLUT = useCallback(
    props => {
      const immediate = true;
      commandsManager.run({
        commandName: 'setViewportColormap',
        commandOptions: {
          ...props,
          immediate,
        },
        context: 'CORNERSTONE',
      });
    },
    [commandsManager]
  );

  const onSetColorbar = useCallback(
    props => {
      commandsManager.run({
        commandName: 'toggleViewportColorbar',
        commandOptions: {
          ...props,
        },
        context: 'CORNERSTONE',
      });
    },
    [commandsManager]
  );

  const getCurrentViewportColormap = viewportId => {
    const { properties } = cornerstoneViewportService.getPresentation(viewportId);
    const colormap = properties?.colormap;
    if (!colormap) {
      return colormaps.find(c => c.Name === 'Grayscale') || colormaps[0];
    }
    return colormap;
  };

  useEffect(() => {
    const updateColorbarState = () => {
      setColorbarState(colorbarService.isColorbarToggled(viewportId));
    };

    const { unsubscribe } = colorbarService.subscribe(
      colorbarService.EVENTS.COLORBAR_STATE_CHANGED,
      updateColorbarState
    );

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const colorbarState = colorbarService.getColorbarState(viewportId);
    if (colorbarState && colorbarState.needsRefresh) {
      window.setTimeout(() => {
        colorbarService.removeColorbar(viewportId);
        onSetColorbar({
          viewportId,
          options: {
            colormaps,
            ticks: {
              position: coloarbarTickPosition,
            },
            width: colorbarWidth,
            position: colorbarContainerPosition,
            activeColormapName: coloarbarInitialColormap,
          },
        });
      }, 0);
    }
    return () => {
      const colorbarState = colorbarService.getColorbarState(viewportId);
      if (colorbarState) {
        colorbarService.markForRefresh(viewportId, true);
      }
    };
  }, []);

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
    >
      <AllInOneMenu.ItemPanel>
        <div className="all-in-one-menu-item flex w-full justify-center">
          <SwitchButton
            label="Display Color bar"
            checked={colorbarState}
            onChange={() => {
              onSetColorbar({
                viewportId,
                options: {
                  colormaps,
                  ticks: {
                    position: coloarbarTickPosition,
                  },
                  width: colorbarWidth,
                  position: colorbarContainerPosition,
                  activeColormapName: coloarbarInitialColormap,
                },
              });
            }}
          />
        </div>
        {colormaps && (
          <AllInOneMenu.SubMenu
            key="colorLUTPresets"
            itemLabel="Color LUT"
            itemIcon="icon-color-lut"
          >
            <div className="all-in-one-menu-item flex w-full justify-center">
              <SwitchButton
                label="Preview in viewport"
                checked={showPreview}
                onChange={checked => {
                  setShowPreview(checked);
                }}
              />
            </div>
            <AllInOneMenu.DividerItem />
            <AllInOneMenu.ItemPanel>
              {colormaps.map((colormap, index) => (
                <AllInOneMenu.Item
                  key={index}
                  label={colormap.description}
                  onClick={() => {
                    onSetColorLUT({ viewportId, colormap });
                    setPrePreviewColormap(getCurrentViewportColormap(viewportId));
                  }}
                  onMouseEnter={() => {
                    if (showPreviewRef.current) {
                      setPrePreviewColormap(getCurrentViewportColormap(viewportId));
                      onSetColorLUT({ viewportId, colormap });
                    }
                  }}
                  onMouseLeave={() => {
                    if (showPreviewRef.current && prePreviewColormapRef.current) {
                      onSetColorLUT({ viewportId, colormap: prePreviewColormapRef.current });
                    }
                  }}
                ></AllInOneMenu.Item>
              ))}
            </AllInOneMenu.ItemPanel>
          </AllInOneMenu.SubMenu>
        )}
        {presets && (
          <AllInOneMenu.SubMenu
            key="windowLevelPresets"
            itemLabel={t('Modality Window Presets', { modality: Object.keys(presets)[0] })}
            itemIcon="viewport-window-level"
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
