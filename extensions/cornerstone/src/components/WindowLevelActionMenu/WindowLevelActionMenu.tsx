import React, { ReactElement, useCallback, useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { AllInOneMenu, ButtonGroup, SwitchButton, useViewportGrid } from '@ohif/ui';
import { CommandsManager, ServicesManager } from '@ohif/core';

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
  serviceManager: ServicesManager;
  colormapProperties: {
    width: string;
    colorbarTickPosition: string;
    colorbarContainerPosition: string;
    colormaps: Array<ColorMapPreset>;
    colorbarInitialColormap: string;
  };
};

const buttons = [
  {
    children: 'PET',
    key: 0,
    style: {
      minWidth: '50%',
    },
  },
  {
    children: 'CT',
    key: 1,
    style: {
      minWidth: '50%',
    },
  },
];

export function WindowLevelActionMenu({
  viewportId,
  element,
  presets,
  verticalDirection,
  horizontalDirection,
  commandsManager,
  serviceManager,
  colormapProperties,
}: WindowLevelActionMenuProps): ReactElement {
  const { colorbarService, cornerstoneViewportService } = serviceManager.services;
  const {
    width: colorbarWidth,
    colorbarTickPosition,
    colorbarContainerPosition,
    colormaps,
    colorbarInitialColormap,
  } = colormapProperties;
  const { t } = useTranslation('WindowLevelActionMenu');

  const [viewportGrid] = useViewportGrid();
  const { activeViewportId } = viewportGrid;

  const [vpHeight, setVpHeight] = useState(element?.clientHeight);
  const [showColorbar, setShowColorbar] = useState(colorbarService.hasColorbar(viewportId));
  const [showPreview, setShowPreview] = useState(false);
  const [prePreviewColormap, setPrePreviewColormap] = useState(null);

  const showPreviewRef = useRef(showPreview);
  showPreviewRef.current = showPreview;
  const prePreviewColormapRef = useRef(prePreviewColormap);
  prePreviewColormapRef.current = prePreviewColormap;

  useEffect(() => {
    const newVpHeight = element?.clientHeight;
    if (vpHeight !== newVpHeight) {
      setVpHeight(newVpHeight);
    }
  }, [element, vpHeight]);

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
      commandsManager.run({
        commandName: 'setViewportColormap',
        commandOptions: {
          ...props,
          immediate: true,
        },
        context: 'CORNERSTONE',
      });
    },
    [commandsManager]
  );

  const onSetColorbar = useCallback(
    props => {
      const colormap = getViewportColormap(viewportId);
      // incase an initialColormap for the colorbar is set, but they have no colormap on the viewport
      // if they have a colormap on the viewport, that takes priority
      if (props.options.activeColormapName && !colormap) {
        onSetColorLUT({
          viewportId,
          colormap: colormaps.find(c => c.Name === props.options.activeColormapName),
        });
      }
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

  const getViewportColormap = viewportId => {
    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
    const { colormap } = viewport.getProperties();
    if (!colormap) {
      return colormaps.find(c => c.Name === 'Grayscale') || colormaps[0];
    }
    return colormap;
  };

  useEffect(() => {
    const updateColorbarState = () => {
      setShowColorbar(colorbarService.hasColorbar(viewportId));
    };

    const { unsubscribe } = colorbarService.subscribe(
      colorbarService.EVENTS.STATE_CHANGED,
      updateColorbarState
    );

    return () => {
      unsubscribe();
    };
  }, [viewportId]);

  useEffect(() => {
    const colorbarState = colorbarService.getViewportColorbar(viewportId);
    if (!colorbarState) {
      return;
    }
    colorbarService.removeColorbar(viewportId);
    onSetColorbar({
      viewportId,
      options: {
        colormaps,
        ticks: {
          position: colorbarTickPosition,
        },
        width: colorbarWidth,
        position: colorbarContainerPosition,
        activeColormapName: colorbarInitialColormap,
      },
    });
  }, [viewportId]);

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
            checked={showColorbar}
            onChange={() => {
              onSetColorbar({
                viewportId,
                options: {
                  colormaps,
                  ticks: {
                    position: colorbarTickPosition,
                  },
                  width: colorbarWidth,
                  position: colorbarContainerPosition,
                  activeColormapName: colorbarInitialColormap,
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
              <ButtonGroup
                buttons={buttons}
                onActiveIndexChange={index => {}}
                defaultActiveIndex={0}
                className="w-[70%]"
              />
            </div>
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
                    setPrePreviewColormap(getViewportColormap(viewportId));
                  }}
                  onMouseEnter={() => {
                    if (showPreviewRef.current) {
                      setPrePreviewColormap(getViewportColormap(viewportId));
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
