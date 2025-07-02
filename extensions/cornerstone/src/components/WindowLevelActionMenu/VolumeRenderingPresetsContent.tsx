import { Icons, FooterAction } from '@ohif/ui-next';
import React, { ReactElement, useState, useCallback } from 'react';
import { PresetDialog } from '@ohif/ui-next';
import { ViewportPreset, VolumeRenderingPresetsContentProps } from '../../types/ViewportPresets';
import { useSystem } from '@ohif/core';

interface Props extends VolumeRenderingPresetsContentProps {
  hide: () => void;
}

export function VolumeRenderingPresetsContent({ presets, viewportId, hide }: Props): ReactElement {
  const { commandsManager } = useSystem();
  const [searchValue, setSearchValue] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<ViewportPreset | null>(null);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
  }, []);

  const handleApply = useCallback(
    props => {
      commandsManager.runCommand('setViewportPreset', {
        ...props,
      });
    },
    [commandsManager]
  );

  const filteredPresets = searchValue
    ? presets.filter(preset => preset.name.toLowerCase().includes(searchValue.toLowerCase()))
    : presets;

  const formatLabel = (label: string, maxChars: number) => {
    return label.length > maxChars ? `${label.slice(0, maxChars)}...` : label;
  };

  return (
    <PresetDialog className="h-[500px]">
      <PresetDialog.PresetBody>
        <PresetDialog.PresetFilter>
          <PresetDialog.PresetSearch
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Search all"
          />
        </PresetDialog.PresetFilter>
        <PresetDialog.PresetGrid>
          {filteredPresets.map((preset, index) => (
            <div
              key={index}
              className="flex cursor-pointer flex-col items-start"
              onClick={() => {
                setSelectedPreset(preset);
                handleApply({ preset: preset.name, viewportId });
              }}
            >
              <Icons.ByName
                name={preset.name}
                className={
                  selectedPreset?.name === preset.name
                    ? 'border-highlight h-[75px] w-[95px] max-w-none rounded border-2'
                    : 'hover:border-highlight h-[75px] w-[95px] max-w-none rounded border-2 border-black'
                }
              />
              <label className="text-muted-foreground mt-1 text-left text-xs">
                {formatLabel(preset.name, 11)}
              </label>
            </div>
          ))}
        </PresetDialog.PresetGrid>
      </PresetDialog.PresetBody>
      <FooterAction className="mt-4 flex-shrink-0">
        <FooterAction.Right>
          <FooterAction.Secondary onClick={hide}>Cancel</FooterAction.Secondary>
        </FooterAction.Right>
      </FooterAction>
    </PresetDialog>
  );
}
