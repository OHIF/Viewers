import React, { memo, useCallback, useState } from 'react';

import {
  Button,
  Icons,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@ohif/ui-next';

import {
  DENTAL_MEASUREMENT_PRESETS,
  DentalMeasurementPresetId,
} from './dentalMeasurementPresets';

type DentalMeasurementsPaletteProps = {
  onSelectPreset: (presetId: DentalMeasurementPresetId, note: string) => void;
};

function DentalMeasurementsPalette({ onSelectPreset }: DentalMeasurementsPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState('');

  const handlePresetSelect = useCallback(
    (presetId: DentalMeasurementPresetId) => {
      onSelectPreset(presetId, note);
      setNote('');
      setIsOpen(false);
    },
    [note, onSelectPreset]
  );

  return (
    <Popover
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="text-primary hover:bg-muted h-10 gap-2 px-2 text-xs"
          data-cy="dental-measurements-button"
        >
          <Icons.ByName
            name="tool-length"
            className="h-5 w-5"
          />
          <span>Measurements</span>
          <span className="bg-primary h-5 w-px" />
          <Icons.ByName
            name="chevron-down"
            className="h-4 w-4"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        className="w-[260px] p-2"
        data-cy="dental-measurements-palette"
      >
        <div className="px-2 pb-2 pt-1 text-xs font-semibold">Dental measurements</div>
        <div className="space-y-1">
          {DENTAL_MEASUREMENT_PRESETS.map(preset => (
            <Button
              key={preset.id}
              variant="ghost"
              className="hover:bg-muted flex h-10 w-full justify-start gap-3 px-2"
              data-cy={`dental-measurement-preset-${preset.id}`}
              onClick={() => handlePresetSelect(preset.id)}
            >
              <Icons.ByName
                name={preset.toolName === 'Angle' ? 'tool-angle' : 'tool-length'}
                className="text-primary h-5 w-5 flex-shrink-0"
              />
              <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                <span className="truncate text-sm">{preset.label}</span>
                <span className="text-muted-foreground text-xs">{preset.unit}</span>
              </span>
            </Button>
          ))}
        </div>
        <div className="border-muted mt-2 border-t px-2 pt-2">
          <label
            htmlFor="dental-measurement-note"
            className="text-muted-foreground mb-1 block text-[11px]"
          >
            Optional note
          </label>
          <Input
            id="dental-measurement-note"
            value={note}
            maxLength={120}
            className="h-8 text-xs"
            data-cy="dental-measurement-note"
            onChange={event => setNote(event.target.value)}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default memo(DentalMeasurementsPalette);
