import React, { ReactElement, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { AllInOneMenu, ButtonGroup, SwitchButton } from '@ohif/ui';
import { StackViewport } from '@cornerstonejs/core';
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
    const actorEntry = actorEntries.find(entry => entry.uid.includes(displaySetInstanceUID));
    const { colormap } = viewport.getProperties(actorEntry.uid);
    if (!colormap) {
      return colormaps.find(c => c.Name === 'Grayscale') || colormaps[0];
    }
    return colormap;
  };

  const buttons = useMemo(() => {
    return displaySets.map((displaySet, index) => ({
      children: displaySet.Modality,
      key: index,
      style: {
        minWidth: `calc(100% / ${displaySets.length})`,
        fontSize: '0.8rem',
        textAlign: 'center',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      },
    }));
  }, [displaySets]);

  useEffect(() => {
    setActiveDisplaySet(displaySets[displaySets.length - 1]);
  }, [displaySets]);

  return (
    <>
      {buttons.length > 1 && (
        <div className="all-in-one-menu-item flex w-full justify-center">
          <ButtonGroup
            onActiveIndexChange={index => {
              setActiveDisplaySet(displaySets[index]);
              setPrePreviewColormap(null);
            }}
            activeIndex={
              displaySets.findIndex(
                ds => ds.displaySetInstanceUID === activeDisplaySetRef.current.displaySetInstanceUID
              ) || 1
            }
            className="w-[70%] text-[10px]"
          >
            {buttons.map(({ children, key, style }) => (
              <div
                key={key}
                style={style}
              >
                {children}
              </div>
            ))}
          </ButtonGroup>
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
