import React, { ReactElement, useCallback, useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { AllInOneMenu, ButtonGroup, SwitchButton, useViewportGrid } from '@ohif/ui';
import { CommandsManager, ServicesManager } from '@ohif/core';
import { StackViewport, VolumeViewport } from '@cornerstonejs/core';

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
  displaySets: Array<any>;
};

export function WindowLevelActionMenu({
  viewportId,
  element,
  presets,
  verticalDirection,
  horizontalDirection,
  commandsManager,
  serviceManager,
  colormapProperties,
  displaySets,
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
  const [activeDisplaySet, setActiveDisplaySet] = useState(displaySets[0]);
  const [buttons, setButtons] = useState([]);
  const [menuKey, setMenuKey] = useState(0);

  const showPreviewRef = useRef(showPreview);
  showPreviewRef.current = showPreview;
  const prePreviewColormapRef = useRef(prePreviewColormap);
  prePreviewColormapRef.current = prePreviewColormap;
  const activeDisplaySetRef = useRef(activeDisplaySet);
  activeDisplaySetRef.current = activeDisplaySet;

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
      const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
      const displaySetInstanceUIDs = [];
      if (viewport instanceof StackViewport) {
        displaySetInstanceUIDs.push(viewportId);
      }
      if (viewport instanceof VolumeViewport) {
        displaySets.forEach(ds => {
          if (ds.Modality !== 'RTSTRUCT' && ds.Modality !== 'SEG') {
            displaySetInstanceUIDs.push(ds.displaySetInstanceUID);
          }
        });
      }
      commandsManager.run({
        commandName: 'toggleViewportColorbar',
        commandOptions: {
          ...props,
          displaySetInstanceUIDs,
        },
        context: 'CORNERSTONE',
      });
    },
    [commandsManager]
  );

  const getViewportColormap = (viewportId, displaySet) => {
    const { displaySetInstanceUID } = displaySet;
    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
    if (viewport instanceof StackViewport) {
      const { colormap } = viewport.getProperties();
      if (!colormap) {
        return colormaps.find(c => c.Name === 'Grayscale') || colormaps[0];
      }
      return colormap;
    }
    const actorEntries = viewport.getActors();
    const actorEntry = actorEntries.find(entry => entry.uid.includes(displaySetInstanceUID));
    const { colormap } = viewport.getProperties(actorEntry.uid);
    if (!colormap) {
      return colormaps.find(c => c.Name === 'Grayscale') || colormaps[0];
    }
    return colormap;
  };

  const generateButtons = useCallback(() => {
    const filteredDisplaySets = displaySets.filter(
      ds => ds.Modality !== 'SEG' && ds.Modality !== 'RTSTRUCT'
    );
    const buttons = filteredDisplaySets.map((displaySet, index) => {
      return {
        children: displaySet.Modality,
        key: index,
        style: {
          minWidth: `calc(100% / ${displaySets.length})`,
        },
      };
    });

    return buttons;
  }, [displaySets]);

  useEffect(() => {
    setButtons(generateButtons());
  }, [displaySets, generateButtons, viewportId]);

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
    if (!showColorbar) {
      return;
    }
    window.setTimeout(() => {
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
    }, 0);
  }, [viewportId]);

  useEffect(() => {
    const newVpHeight = element?.clientHeight;
    if (vpHeight !== newVpHeight) {
      setVpHeight(newVpHeight);
    }
  }, [element, vpHeight]);

  useEffect(() => {
    setActiveDisplaySet(displaySets[0]);
  }, [displaySets]);

  useEffect(() => {
    setMenuKey(menuKey + 1);
  }, [activeDisplaySet, showPreview, showColorbar]);

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
            {buttons.length > 1 && (
              <div className="all-in-one-menu-item flex w-full justify-center">
                <ButtonGroup
                  buttons={buttons}
                  onActiveIndexChange={index => {
                    setActiveDisplaySet(displaySets[index]);
                    setPrePreviewColormap(null);
                  }}
                  defaultActiveIndex={
                    displaySets.findIndex(
                      ds =>
                        ds.displaySetInstanceUID ===
                        activeDisplaySetRef.current.displaySetInstanceUID
                    ) || 0
                  }
                  className="w-[70%] text-[10px]"
                />
              </div>
            )}
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
                    onSetColorLUT({
                      viewportId,
                      colormap,
                      displaySetInstanceUID: activeDisplaySetRef.current.displaySetInstanceUID,
                    });
                    setPrePreviewColormap(null);
                  }}
                  onMouseEnter={() => {
                    if (showPreviewRef.current) {
                      setPrePreviewColormap(
                        getViewportColormap(viewportId, activeDisplaySetRef.current)
                      );
                      onSetColorLUT({
                        viewportId,
                        colormap,
                        displaySetInstanceUID: activeDisplaySetRef.current.displaySetInstanceUID,
                      });
                    }
                  }}
                  onMouseLeave={() => {
                    if (showPreviewRef.current && prePreviewColormapRef.current) {
                      onSetColorLUT({
                        viewportId,
                        colormap: prePreviewColormapRef.current,
                        displaySetInstanceUID: activeDisplaySetRef.current.displaySetInstanceUID,
                      });
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
