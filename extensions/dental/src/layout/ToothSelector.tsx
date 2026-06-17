import React, { memo, useMemo } from 'react';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icons,
} from '@ohif/ui-next';

import { DentalPreferences } from '../preferences/dentalPreferences';
import {
  TOOTH_IDENTITIES,
  ToothNumberingSystem,
  getToothDisplayLabel,
  getToothIdentityById,
} from '../tooth/toothIdentity';

const TOOTH_SELECTOR_TRIGGER_CLASS =
  'bg-transparent text-foreground/80 hover:bg-background hover:text-highlight flex h-10 w-[280px] items-center justify-between gap-2 rounded-lg px-2 text-xs';

const NUMBERING_BUTTON_CLASS = 'h-8 px-2 text-xs';

type ToothSelectorProps = {
  preferences: DentalPreferences;
  onSelectedToothChange: (toothId: string) => void;
  onNumberingSystemChange: (numberingSystem: ToothNumberingSystem) => void;
};

function ToothSelector({
  preferences,
  onSelectedToothChange,
  onNumberingSystemChange,
}: ToothSelectorProps) {
  const selectedTooth = getToothIdentityById(preferences.selectedToothId) || TOOTH_IDENTITIES[0];
  const selectedToothLabel = `${getToothDisplayLabel(
    selectedTooth,
    preferences.numberingSystem
  )} - ${selectedTooth.label}`;

  const toothOptions = useMemo(
    () =>
      TOOTH_IDENTITIES.map(tooth => ({
        id: tooth.id,
        label: `${getToothDisplayLabel(tooth, preferences.numberingSystem)} - ${tooth.label}`,
      })),
    [preferences.numberingSystem]
  );

  return (
    <div
      className="flex h-10 items-center gap-1"
      data-cy="dental-tooth-selector"
    >
      <Button
        variant={preferences.numberingSystem === 'FDI' ? 'default' : 'ghost'}
        className={NUMBERING_BUTTON_CLASS}
        data-cy="dental-numbering-system-fdi"
        onClick={() => onNumberingSystemChange('FDI')}
      >
        FDI
      </Button>
      <Button
        variant={preferences.numberingSystem === 'Universal' ? 'default' : 'ghost'}
        className={NUMBERING_BUTTON_CLASS}
        data-cy="dental-numbering-system-universal"
        onClick={() => onNumberingSystemChange('Universal')}
      >
        UNI
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={TOOTH_SELECTOR_TRIGGER_CLASS}
            data-cy="dental-selected-tooth"
          >
            <span className="truncate">{selectedToothLabel}</span>
            <span className="flex flex-shrink-0 items-center gap-1">
              <span className="bg-primary h-5 w-px" />
              <Icons.ByName
                name="chevron-down"
                className="text-primary h-5 w-5"
              />
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="bottom"
          align="start"
          alignOffset={-40}
          className="max-h-[420px] w-[280px] overflow-y-auto"
        >
          {toothOptions.map(option => (
            <DropdownMenuItem
              key={option.id}
              className="flex items-center space-x-2"
              data-cy="dental-tooth-option"
              onSelect={() => onSelectedToothChange(option.id)}
            >
              <span className="truncate">{option.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default memo(ToothSelector);
