import React, { useState, useCallback } from 'react';
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from '@ohif/ui-next';

type NamingSystem = 'FDI' | 'Universal';
const UPPER_ROW: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const LOWER_ROW: readonly number[] = [
  32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17,
];
const UNIVERSAL_TO_FDI: Readonly<Record<number, number>> = {
  1: 18,
  2: 17,
  3: 16,
  4: 15,
  5: 14,
  6: 13,
  7: 12,
  8: 11,
  9: 21,
  10: 22,
  11: 23,
  12: 24,
  13: 25,
  14: 26,
  15: 27,
  16: 28,
  17: 38,
  18: 37,
  19: 36,
  20: 35,
  21: 34,
  22: 33,
  23: 32,
  24: 31,
  25: 41,
  26: 42,
  27: 43,
  28: 44,
  29: 45,
  30: 46,
  31: 47,
  32: 48,
};

const BTN_BASE = '!rounded-lg inline-flex items-center justify-center w-10 h-10';
const BTN_DEFAULT = 'bg-transparent text-foreground/80 hover:bg-background hover:text-highlight';
const BTN_ACTIVE = 'bg-highlight text-background hover:!bg-highlight/80';

function toDisplay(universalId: number, system: NamingSystem): number {
  return system === 'FDI' ? UNIVERSAL_TO_FDI[universalId] : universalId;
}

function formatSelectedLabel(selected: Set<number>, system: NamingSystem): string {
  if (selected.size === 0) return '';
  return [...selected]
    .sort((a, b) => toDisplay(a, system) - toDisplay(b, system))
    .map(n => toDisplay(n, system))
    .join(', ');
}

interface ToothCellProps {
  universalId: number;
  system: NamingSystem;
  isSelected: boolean;
  onToggle: (id: number) => void;
}

function ToothCell({
  universalId,
  system,
  isSelected,
  onToggle,
}: ToothCellProps): React.ReactElement {
  const displayNum = toDisplay(universalId, system);
  return (
    <button
      type="button"
      aria-label={`Tooth ${displayNum}`}
      aria-pressed={isSelected}
      className={cn(
        'h-7 w-7 select-none rounded text-[10px] font-semibold leading-none transition-colors duration-100',
        isSelected
          ? 'bg-highlight text-background'
          : 'bg-input/40 text-foreground/70 hover:bg-muted hover:text-highlight'
      )}
      onClick={() => onToggle(universalId)}
    >
      {displayNum}
    </button>
  );
}

interface ToothArchRowProps {
  teeth: readonly number[];
  selected: Set<number>;
  system: NamingSystem;
  onToggle: (id: number) => void;
}

function ToothArchRow({
  teeth,
  selected,
  system,
  onToggle,
}: ToothArchRowProps): React.ReactElement {
  const leftQuadrant = teeth.slice(0, 8);
  const rightQuadrant = teeth.slice(8);
  return (
    <div className="flex items-center gap-0.5">
      {leftQuadrant.map(id => (
        <ToothCell
          key={id}
          universalId={id}
          system={system}
          isSelected={selected.has(id)}
          onToggle={onToggle}
        />
      ))}
      {/* Midline separator */}
      <div className="bg-border mx-0.5 h-8 w-px shrink-0" />
      {rightQuadrant.map(id => (
        <ToothCell
          key={id}
          universalId={id}
          system={system}
          isSelected={selected.has(id)}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}

function ToothIcon(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7"
      aria-hidden="true"
    >
      <path d="M9 3C7.34 3 6 4.34 6 6c0 1.1.4 2.1 1.06 2.87V18a3 3 0 006 0v-2a3 3 0 006 0V8.87C19.6 8.1 20 7.1 20 6c0-1.66-1.34-3-3-3a3 3 0 00-2.6 1.5A3 3 0 0012 3a3 3 0 00-2.6 1.5A3 3 0 009 3z" />
    </svg>
  );
}

export default function ToothSelectorButton(): React.ReactElement {
  const [open, setOpen] = useState<boolean>(false);
  const [selectedTeeth, setSelectedTeeth] = useState<Set<number>>(new Set());
  const [namingSystem, setNamingSystem] = useState<NamingSystem>('FDI');

  const isActive = open || selectedTeeth.size > 0;

  const toggleTooth = useCallback((id: number): void => {
    setSelectedTeeth(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback((): void => {
    setSelectedTeeth(new Set());
  }, []);

  return (
    <Tooltip>
      <Popover open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(BTN_BASE, isActive ? BTN_ACTIVE : BTN_DEFAULT)}
              aria-label="Tooth Selector"
              data-cy="ToothSelector"
              data-tool="ToothSelector"
              data-active={isActive}
            >
              <ToothIcon />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>

        <TooltipContent
          side="bottom"
          className="text-wrap w-auto max-w-sm whitespace-normal break-words"
        >
          <div className="space-y-1">
            <div className="text-sm">Tooth Selector</div>
            <div className="text-muted-foreground text-xs">
              Select teeth by FDI or Universal number
            </div>
          </div>
        </TooltipContent>

        <PopoverContent
          side="bottom"
          align="center"
          sideOffset={8}
          className="w-auto min-w-0 space-y-2.5 p-3"
        >
          <div className="flex items-center justify-between gap-4">
            <span className="text-foreground/70 text-[11px] font-semibold uppercase tracking-wider">
              Tooth Selector
            </span>

            <div className="border-input flex overflow-hidden rounded-md border">
              {(['FDI', 'Universal'] as const).map(sys => (
                <button
                  key={sys}
                  type="button"
                  aria-pressed={namingSystem === sys}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium transition-colors duration-100',
                    namingSystem === sys
                      ? 'bg-highlight text-background'
                      : 'text-foreground/70 hover:bg-muted hover:text-foreground bg-transparent'
                  )}
                  onClick={() => setNamingSystem(sys)}
                >
                  {sys}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1 px-0.5">
              <span className="text-muted-foreground flex-1 text-right text-[9px]">
                Upper Right (R)
              </span>
              <span className="w-2 shrink-0" />
              <span className="text-muted-foreground flex-1 text-left text-[9px]">
                (L) Upper Left
              </span>
            </div>

            <ToothArchRow
              teeth={UPPER_ROW}
              selected={selectedTeeth}
              system={namingSystem}
              onToggle={toggleTooth}
            />

            <ToothArchRow
              teeth={LOWER_ROW}
              selected={selectedTeeth}
              system={namingSystem}
              onToggle={toggleTooth}
            />

            <div className="flex items-center gap-1 px-0.5">
              <span className="text-muted-foreground flex-1 text-right text-[9px]">
                Lower Right (R)
              </span>
              <span className="w-2 shrink-0" />
              <span className="text-muted-foreground flex-1 text-left text-[9px]">
                (L) Lower Left
              </span>
            </div>
          </div>

          <div className="border-input flex min-h-[22px] items-center justify-between gap-2 border-t pt-2">
            <span className="text-muted-foreground max-w-[300px] truncate text-[11px]">
              {selectedTeeth.size > 0 ? (
                <>
                  <span className="font-medium">{selectedTeeth.size}</span>
                  {` selected (${namingSystem}): `}
                  {formatSelectedLabel(selectedTeeth, namingSystem)}
                </>
              ) : (
                <span className="italic">No teeth selected</span>
              )}
            </span>

            {selectedTeeth.size > 0 && (
              <button
                type="button"
                className="text-muted-foreground hover:text-destructive shrink-0 text-[11px] transition-colors duration-100"
                onClick={clearSelection}
              >
                Clear
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </Tooltip>
  );
}
