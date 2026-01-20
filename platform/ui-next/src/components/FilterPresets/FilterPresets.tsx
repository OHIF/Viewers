import React from 'react';
import { Button } from '../Button';

export interface FilterPreset {
  id: string;
  label: string;
  filterValues: Record<string, any>;
}

interface FilterPresetsProps {
  presets: FilterPreset[];
  onPresetSelected: (preset: FilterPreset) => void;
  activePresetId?: string;
}

const FilterPresets: React.FC<FilterPresetsProps> = ({
  presets,
  onPresetSelected,
  activePresetId,
}) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-400">Quick Filters:</span>
      <div className="flex gap-2">
        {presets.map(preset => (
          <Button
            key={preset.id}
            variant={activePresetId === preset.id ? 'default' : 'secondary'}
            size="sm"
            onClick={() => onPresetSelected(preset)}
            className="h-7 text-xs"
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export { FilterPresets };
