import React, { MutableRefObject, ReactElement, useEffect, useRef, useState } from 'react';
import { AllInOneMenu, ScrollArea, Switch, Tabs, TabsList, TabsTrigger } from '@ohif/ui-next';
import { useViewportRendering } from '../../hooks/useViewportRendering';
import { WindowLevelPreset } from '../../types/WindowLevel';

export function WindowLevel({ viewportId }: { viewportId?: string } = {}): ReactElement {
  const { windowLevelPresets, setWindowLevelPreset, viewportDisplaySets } =
    useViewportRendering(viewportId);

  const [activeDisplaySet, setActiveDisplaySet] = useState(viewportDisplaySets?.[0]);

  const [showPreview, setShowPreview] = useState(false);
  const [prePreviewPreset, setPrePreviewPreset] = useState<WindowLevelPreset | null>(null);
  const [currentPreset, setCurrentPreset] = useState<WindowLevelPreset | null>(null);

  const showPreviewRef = useRef(showPreview);
  showPreviewRef.current = showPreview;
  const prePreviewPresetRef = useRef(prePreviewPreset);
  prePreviewPresetRef.current = prePreviewPreset;
  const activeDisplaySetRef = useRef(activeDisplaySet) as MutableRefObject<AppTypes.DisplaySet>;
  activeDisplaySetRef.current = activeDisplaySet;
  const currentPresetRef = useRef(currentPreset);
  currentPresetRef.current = currentPreset;

  useEffect(() => {
    setCurrentPreset(null);
    setPrePreviewPreset(null);
  }, [activeDisplaySet]);

  const handleSetWindowLevel = (preset: WindowLevelPreset) => {
    setWindowLevelPreset(
      {
        windowWidth: Number(preset.window),
        windowCenter: Number(preset.level),
      },
      activeDisplaySetRef.current?.displaySetInstanceUID
    );
  };

  const activeIndex =
    viewportDisplaySets?.findIndex(
      ds => ds.displaySetInstanceUID === activeDisplaySetRef.current?.displaySetInstanceUID
    ) ?? 0;

  const currentModalityPresets = windowLevelPresets[activeIndex] || {};
  const modality = activeDisplaySet?.Modality || Object.keys(currentModalityPresets)[0] || '';
  const presets = currentModalityPresets[modality] || [];

  return (
    <>
      {viewportDisplaySets && viewportDisplaySets.length > 1 && (
        <div className="flex h-8 w-full flex-shrink-0 items-center justify-center px-2 text-base">
          <Tabs
            value={String(activeIndex)}
            onValueChange={val => {
              const index = parseInt(val, 10);
              setActiveDisplaySet(viewportDisplaySets[index]);
            }}
          >
            <TabsList>
              {viewportDisplaySets.map((ds, i) => (
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

            if (!checked && currentPresetRef.current) {
              handleSetWindowLevel(currentPresetRef.current, true);
            }
          }}
        />
      </div>

      <AllInOneMenu.DividerItem />

      <div className="h-[200px] flex-grow">
        <ScrollArea className="h-full w-full">
          <div className="p-1">
            {presets.map((preset, index) => (
              <AllInOneMenu.Item
                key={index}
                label={preset.description}
                secondaryLabel={`${preset.window} / ${preset.level}`}
                useIconSpace={false}
                onClick={() => {
                  setCurrentPreset(preset);
                  handleSetWindowLevel(preset, true);
                  setPrePreviewPreset(null);
                }}
                onMouseEnter={() => {
                  if (showPreviewRef.current && activeDisplaySetRef.current) {
                    if (!prePreviewPresetRef.current) {
                      setPrePreviewPreset(currentPresetRef.current || preset);
                    }
                    handleSetWindowLevel(preset, true);
                  }
                }}
                onMouseLeave={() => {
                  if (
                    showPreviewRef.current &&
                    prePreviewPresetRef.current &&
                    activeDisplaySetRef.current
                  ) {
                    handleSetWindowLevel(prePreviewPresetRef.current, true);
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
