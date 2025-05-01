import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { AllInOneMenu, Switch, Tabs, TabsList, TabsTrigger } from '@ohif/ui-next';

import { StackViewport, Types } from '@cornerstonejs/core';
import { ColormapProps } from '../../types/Colormap';

export function Colormap({
  colormaps,
  viewportId,
  displaySets,
  commandsManager,
  servicesManager,
}: ColormapProps): ReactElement {
  const { cornerstoneViewportService } = servicesManager.services;

  const [activeDisplaySet, setActiveDisplaySet] = useState(displaySets[0]);

  const [showPreview, setShowPreview] = useState(false);
  const [prePreviewColormap, setPrePreviewColormap] = useState(null);

  const showPreviewRef = useRef(showPreview);
  showPreviewRef.current = showPreview;
  const prePreviewColormapRef = useRef(prePreviewColormap);
  prePreviewColormapRef.current = prePreviewColormap;
  const activeDisplaySetRef = useRef(activeDisplaySet);
  activeDisplaySetRef.current = activeDisplaySet;

  const onSetColorLUT = useCallback(
    props => {
      // TODO: Better way to check if it's a fusion
      const oneOpacityColormaps = ['Grayscale', 'X Ray'];
      const opacity =
        displaySets.length > 1 && !oneOpacityColormaps.includes(props.colormap.name) ? 0.5 : 1;
      commandsManager.run({
        commandName: 'setViewportColormap',
        commandOptions: {
          ...props,
          opacity,
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
    const actorEntry = actorEntries?.find(entry =>
      entry.referencedId.includes(displaySetInstanceUID)
    );
    const { colormap } = (viewport as Types.IVolumeViewport).getProperties(actorEntry.referencedId);
    if (!colormap) {
      return colormaps.find(c => c.Name === 'Grayscale') || colormaps[0];
    }
    return colormap;
  };

  const activeIndex = displaySets.findIndex(
    ds => ds.displaySetInstanceUID === activeDisplaySetRef.current.displaySetInstanceUID
  );

  useEffect(() => {
    setActiveDisplaySet(displaySets[displaySets.length - 1]);
  }, [displaySets]);

  return (
    <>
      {displaySets.length > 1 && (
        <div className="flex h-8 w-full flex-shrink-0 items-center justify-center px-2 text-base">
          <Tabs
            value={String(activeIndex)}
            onValueChange={val => {
              const index = parseInt(val, 10);
              setActiveDisplaySet(displaySets[index]);
              setPrePreviewColormap(null);
            }}
          >
            <TabsList>
              {displaySets.map((ds, i) => (
                <TabsTrigger
                  key={i}
                  value={String(i)}
                >
                  {ds.Modality}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}
      <div
        className="hover:bg-accent flex h-8 w-full flex-shrink-0 cursor-pointer items-center px-2 text-base hover:rounded"
        onClick={() => setShowPreview(!showPreview)}
      >
        <span className="flex-shrink-0">Preview in viewport</span>
        <Switch
          className="ml-auto flex-shrink-0"
          checked={showPreview}
          onCheckedChange={checked => {
            setShowPreview(checked);
          }}
        />
      </div>
      <AllInOneMenu.DividerItem />
      <AllInOneMenu.ItemPanel
        maxHeight="calc(100vh - 250px)"
        className="min-h-[200px] flex-grow"
      >
        {colormaps.map((colormap, index) => (
          <AllInOneMenu.Item
            key={index}
            label={colormap.description}
            useIconSpace={false}
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
