import React, { ReactElement, useEffect, useRef, useState } from 'react';
import { AllInOneMenu, ScrollArea, Switch, Tabs, TabsList, TabsTrigger } from '@ohif/ui-next';
import { useViewportRendering } from '../../hooks/useViewportRendering';
import { useViewportDisplaySets } from '../../hooks/useViewportDisplaySets';
import { WindowLevelPreset } from '../../types/WindowLevel';
import { useTranslation } from 'react-i18next';

export function WindowLevel({ viewportId }: { viewportId?: string } = {}): ReactElement {
  const { t } = useTranslation('WindowLevelActionMenu');
  const { viewportDisplaySets, foregroundDisplaySets } = useViewportDisplaySets(viewportId);
  // Default the active tab to the foreground layer (e.g. the PT in a PET/CT
  // fusion), matching the other window-level controls, instead of the grayscale
  // background (CT) at index 0. The CT/PT tabs still let the user switch.
  const defaultDisplaySetUID =
    foregroundDisplaySets?.length > 0
      ? foregroundDisplaySets[foregroundDisplaySets.length - 1].displaySetInstanceUID
      : viewportDisplaySets?.[0]?.displaySetInstanceUID;
  const [activeDisplaySetUID, setActiveDisplaySetUID] = useState<string | undefined>(
    defaultDisplaySetUID
  );
  // Tracks whether the user has explicitly picked a tab, so the foreground-default
  // sync below stops overriding their choice.
  const userSelectedRef = useRef(false);

  // Adopt the foreground default if the display sets resolve after first render
  // (and the user has not picked a tab yet). This must re-sync even when the
  // initial render already seeded `activeDisplaySetUID` with the CT fallback
  // (because `foregroundDisplaySets` was still empty at mount) — otherwise the
  // tab stays pinned to CT once the foreground (PT) layer resolves.
  useEffect(() => {
    if (
      !userSelectedRef.current &&
      defaultDisplaySetUID &&
      activeDisplaySetUID !== defaultDisplaySetUID
    ) {
      setActiveDisplaySetUID(defaultDisplaySetUID);
    }
  }, [activeDisplaySetUID, defaultDisplaySetUID]);

  // Use the hook with the active display set
  const { windowLevelPresets, setWindowLevel } = useViewportRendering(viewportId, {
    displaySetInstanceUID: activeDisplaySetUID,
  });

  const [showPreview, setShowPreview] = useState(false);
  const [prePreviewPreset, setPrePreviewPreset] = useState<WindowLevelPreset | null>(null);
  const [currentPreset, setCurrentPreset] = useState<WindowLevelPreset | null>(null);

  const showPreviewRef = useRef(showPreview);
  showPreviewRef.current = showPreview;
  const prePreviewPresetRef = useRef(prePreviewPreset);
  prePreviewPresetRef.current = prePreviewPreset;
  const currentPresetRef = useRef(currentPreset);
  currentPresetRef.current = currentPreset;

  // Reset presets when active display set changes
  useEffect(() => {
    setCurrentPreset(null);
    setPrePreviewPreset(null);
  }, [activeDisplaySetUID]);

  // Handle applying window level preset
  const handleSetWindowLevel = (preset: WindowLevelPreset, immediate = false) => {
    setWindowLevel({
      windowWidth: Number(preset.window),
      windowCenter: Number(preset.level),
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
              userSelectedRef.current = true;
              setActiveDisplaySetUID(displaySetUID);
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
        <span className="flex-shrink-0">{t('Preview in viewport')}</span>
        <Switch
          className="ml-auto flex-shrink-0"
          checked={showPreview}
          onCheckedChange={checked => {
            setShowPreview(checked);

            // When turning off preview, restore the current preset if one exists
            if (!checked && currentPresetRef.current) {
              handleSetWindowLevel(currentPresetRef.current, true);
            }
          }}
        />
      </div>

      <AllInOneMenu.DividerItem />

      <div className="h-[175px] flex-grow">
        <ScrollArea className="h-full w-full">
          <div className="p-1">
            {windowLevelPresets.map((preset, index) => (
              <AllInOneMenu.Item
                key={index}
                label={t(preset.description)}
                secondaryLabel={`${preset.window} / ${preset.level}`}
                useIconSpace={false}
                onClick={() => {
                  setCurrentPreset(preset);
                  handleSetWindowLevel(preset, true);
                  setPrePreviewPreset(null);
                }}
                onMouseEnter={() => {
                  if (showPreviewRef.current) {
                    if (!prePreviewPresetRef.current) {
                      setPrePreviewPreset(currentPresetRef.current || preset);
                    }
                    handleSetWindowLevel(preset, true);
                  }
                }}
                onMouseLeave={() => {
                  if (showPreviewRef.current && prePreviewPresetRef.current) {
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
