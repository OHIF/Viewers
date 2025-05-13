import React, { ReactElement, useEffect, useRef, useState } from 'react';
import { AllInOneMenu, ScrollArea, Switch, Tabs, TabsList, TabsTrigger } from '@ohif/ui-next';
import { useViewportRendering } from '../../hooks/useViewportRendering';

export function Colormap({ viewportId }: { viewportId?: string } = {}): ReactElement {
  const { viewportDisplaySets } = useViewportRendering(viewportId);

  const [activeDisplaySetUID, setActiveDisplaySetUID] = useState<string | undefined>(
    viewportDisplaySets?.[0]?.displaySetInstanceUID
  );

  // Use the hook with the active display set
  const { colorbarProperties, setColormap } = useViewportRendering(viewportId, {
    displaySetInstanceUID: activeDisplaySetUID,
  });

  const { colormaps } = colorbarProperties;

  const [showPreview, setShowPreview] = useState(false);
  const [prePreviewColormap, setPrePreviewColormap] = useState(null);
  const [currentColormap, setCurrentColormap] = useState(null);

  const showPreviewRef = useRef(showPreview);
  showPreviewRef.current = showPreview;
  const prePreviewColormapRef = useRef(prePreviewColormap);
  prePreviewColormapRef.current = prePreviewColormap;
  const currentColormapRef = useRef(currentColormap);
  currentColormapRef.current = currentColormap;

  useEffect(() => {
    setCurrentColormap(null);
    setPrePreviewColormap(null);
  }, [activeDisplaySetUID]);

  const handleSetColorLUT = (colormap, immediate = true) => {
    // Check if it's a fusion viewport
    const oneOpacityColormaps = ['Grayscale', 'X Ray'];
    const opacity =
      viewportDisplaySets.length > 1 && !oneOpacityColormaps.includes(colormap.name) ? 0.5 : 1;

    setColormap({
      colormap,
      opacity,
      immediate,
    });
  };

  return (
    <>
      {viewportDisplaySets && viewportDisplaySets.length > 1 && (
        <div className="flex h-8 w-full flex-shrink-0 items-center justify-center px-2 text-base">
          <Tabs
            value={activeDisplaySetUID}
            onValueChange={displaySetUID => {
              setActiveDisplaySetUID(displaySetUID);
              setPrePreviewColormap(null);
            }}
          >
            <TabsList>
              {viewportDisplaySets.map(ds => (
                <TabsTrigger
                  key={ds.displaySetInstanceUID}
                  value={ds.displaySetInstanceUID}
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

            if (!checked && currentColormapRef.current) {
              handleSetColorLUT(currentColormapRef.current);
            }
          }}
        />
      </div>

      <AllInOneMenu.DividerItem />

      <div className="h-[300px] flex-grow">
        <ScrollArea className="h-full w-full">
          <div className="p-1">
            {colormaps.map((colormap, index) => (
              <AllInOneMenu.Item
                key={index}
                label={colormap.description}
                useIconSpace={false}
                onClick={() => {
                  setCurrentColormap(colormap);
                  handleSetColorLUT(colormap);
                  setPrePreviewColormap(null);
                }}
                onMouseEnter={() => {
                  if (showPreviewRef.current) {
                    if (!prePreviewColormapRef.current) {
                      setPrePreviewColormap(colormap);
                    }
                    handleSetColorLUT(colormap);
                  }
                }}
                onMouseLeave={() => {
                  if (showPreviewRef.current && prePreviewColormapRef.current) {
                    handleSetColorLUT(prePreviewColormapRef.current);
                  }
                }}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
