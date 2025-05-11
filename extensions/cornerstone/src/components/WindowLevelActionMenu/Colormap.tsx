import React, { ReactElement, useRef, useState } from 'react';
import { AllInOneMenu, Switch, Tabs, TabsList, TabsTrigger } from '@ohif/ui-next';
import { useWindowLevel } from '../../hooks/useWindowLevel';

export function Colormap(): ReactElement {
  const {
    colorbarProperties,
    displaySets,
    setColormap,
    getViewportColormap,
    activeDisplaySet,
    setActiveDisplaySet,
    viewportId,
  } = useWindowLevel();

  const { colormaps } = colorbarProperties;

  const [showPreview, setShowPreview] = useState(false);
  const [prePreviewColormap, setPrePreviewColormap] = useState(null);

  const showPreviewRef = useRef(showPreview);
  showPreviewRef.current = showPreview;
  const prePreviewColormapRef = useRef(prePreviewColormap);
  prePreviewColormapRef.current = prePreviewColormap;
  const activeDisplaySetRef = useRef(activeDisplaySet);
  activeDisplaySetRef.current = activeDisplaySet;

  const handleSetColorLUT = props => {
    // Check if it's a fusion viewport
    const oneOpacityColormaps = ['Grayscale', 'X Ray'];
    const opacity =
      displaySets.length > 1 && !oneOpacityColormaps.includes(props.colormap.name) ? 0.5 : 1;

    setColormap({
      ...props,
      opacity,
      immediate: true,
    });
  };

  const activeIndex = displaySets.findIndex(
    ds => ds.displaySetInstanceUID === activeDisplaySetRef.current?.displaySetInstanceUID
  );

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
              handleSetColorLUT({
                viewportId,
                colormap,
                displaySetInstanceUID: activeDisplaySetRef.current?.displaySetInstanceUID,
              });
              setPrePreviewColormap(null);
            }}
            onMouseEnter={() => {
              if (showPreviewRef.current && activeDisplaySetRef.current) {
                setPrePreviewColormap(getViewportColormap(activeDisplaySetRef.current));
                handleSetColorLUT({
                  viewportId,
                  colormap,
                  displaySetInstanceUID: activeDisplaySetRef.current.displaySetInstanceUID,
                });
              }
            }}
            onMouseLeave={() => {
              if (
                showPreviewRef.current &&
                prePreviewColormapRef.current &&
                activeDisplaySetRef.current
              ) {
                handleSetColorLUT({
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
