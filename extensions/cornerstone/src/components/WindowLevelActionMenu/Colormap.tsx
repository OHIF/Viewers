import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { AllInOneMenu, ButtonGroup, SwitchButton } from '@ohif/ui';
import { StackViewport } from '@cornerstonejs/core';
import { CommandsManager, ServicesManager } from '@ohif/core';
import { ColorMapPreset } from './WindowLevelActionMenu';

export type ColormapProps = {
  viewportId: string;
  commandsManager: CommandsManager;
  serviceManager: ServicesManager;
  colormaps: Array<ColorMapPreset>;
  displaySets: Array<any>;
};

export function Colormap({
  colormaps,
  viewportId,
  displaySets,
  commandsManager,
  serviceManager,
}: ColormapProps): ReactElement {
  const { cornerstoneViewportService } = serviceManager.services;

  const [activeDisplaySet, setActiveDisplaySet] = useState(displaySets[0]);

  const [showPreview, setShowPreview] = useState(false);
  const [prePreviewColormap, setPrePreviewColormap] = useState(null);
  const [buttons, setButtons] = useState([]);

  const showPreviewRef = useRef(showPreview);
  showPreviewRef.current = showPreview;
  const prePreviewColormapRef = useRef(prePreviewColormap);
  prePreviewColormapRef.current = prePreviewColormap;
  const activeDisplaySetRef = useRef(activeDisplaySet);
  activeDisplaySetRef.current = activeDisplaySet;

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
    setActiveDisplaySet(displaySets[0]);
  }, [displaySets]);

  return (
    <>
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
                ds => ds.displaySetInstanceUID === activeDisplaySetRef.current.displaySetInstanceUID
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
                setPrePreviewColormap(getViewportColormap(viewportId, activeDisplaySetRef.current));
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
    </>
  );
}
