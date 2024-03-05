import { Icon } from '@ohif/ui';
import { ButtonEnums } from '@ohif/ui';
import React, { ReactElement, useState, useEffect, useCallback } from 'react';
import { Button, InputFilterText } from '@ohif/ui';
import { ViewportPreset, VolumePresetsProps } from '../../types/ViewportPresets';

export function VolumePresets({
  presets,
  viewportId,
  commandsManager,
  onClose,
}: VolumePresetsProps): ReactElement {
  const [filteredPresets, setFilteredPresets] = useState(presets);
  const [searchValue, setSearchValue] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<ViewportPreset | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const formatLabel = (label: string, maxChars: number) => {
    return label.length > maxChars ? `${label.slice(0, maxChars)}...` : label;
  };

  useEffect(() => {
    if (searchValue) {
      const filtered = presets.filter(preset =>
        preset.name.toLowerCase().includes(searchValue.toLowerCase())
      );
      setFilteredPresets(filtered);
    } else {
      setFilteredPresets(presets);
    }
  }, [searchValue, presets]);

  const handleApply = useCallback(
    props => {
      commandsManager.runCommand('setViewportPreset', {
        ...props,
      });
    },
    [commandsManager]
  );

  return (
    <div className="flex min-h-full w-full flex-col justify-between">
      <div className="border-secondary-light h-[433px] w-full overflow-hidden rounded border bg-black px-2.5">
        <div className="flex h-[46px] w-full items-center justify-start">
          <div className="h-[26px] w-[200px]">
            <InputFilterText
              value={searchValue}
              onDebounceChange={handleSearchChange}
              placeholder={'Search all'}
            />
          </div>
        </div>
        <div className="ohif-scrollbar overflow h-[385px] w-full overflow-y-auto">
          <div className="grid grid-cols-4 gap-3 pt-2 pr-3">
            {filteredPresets.map((preset, index) => (
              <div
                key={index}
                className="flex cursor-pointer flex-col items-start"
                onClick={() => setSelectedPreset(preset)}
              >
                <Icon
                  name={preset.name}
                  className={
                    selectedPreset?.name === preset.name
                      ? 'border-primary-light h-[75px] w-[95px] max-w-none rounded border-2'
                      : 'hover:border-primary-light h-[75px] w-[95px] max-w-none rounded border-2 border-black'
                  }
                />
                <label className="text-aqua-pale mt-2 text-left text-xs">
                  {formatLabel(preset.name, 11)}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
      <footer className="flex h-[60px] w-full items-center justify-end">
        <div className="flex gap-2">
          <Button
            name="Cancel"
            size={ButtonEnums.size.medium}
            type={ButtonEnums.type.secondary}
            onClick={onClose}
          >
            {' '}
            Cancel{' '}
          </Button>
          <Button
            name="Apply"
            size={ButtonEnums.size.medium}
            type={ButtonEnums.type.primary}
            disabled={!selectedPreset}
            onClick={() => handleApply({ preset: selectedPreset.name, viewportId })}
          >
            {' '}
            Apply{' '}
          </Button>
        </div>
      </footer>
    </div>
  );
}
