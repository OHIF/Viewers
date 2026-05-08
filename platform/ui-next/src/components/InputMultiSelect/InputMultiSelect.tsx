/**
 * Compound multi-select chip-input built on cmdk.
 *
 *   <InputMultiSelect options={...} value={...} onChange={...}>
 *     <InputMultiSelect.Field>
 *       <InputMultiSelect.Summary />
 *       <InputMultiSelect.Input ariaLabel="..." />
 *     </InputMultiSelect.Field>
 *     <InputMultiSelect.Content fitToContent maxWidth={185}>
 *       <InputMultiSelect.Options />
 *     </InputMultiSelect.Content>
 *   </InputMultiSelect>
 */
import * as React from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../../lib/utils';
import { Command as CommandPrimitive } from 'cmdk';
import { CommandList, CommandGroup, CommandItem, CommandEmpty } from '../Command/Command';
import { Badge } from '../Badge';
import { Icons } from '../Icons';
import { ScrollArea } from '../ScrollArea';

type Option = string | { value: string; label?: string };
type NormalizedOption = { value: string; label: string };
type Coords = { left: number; top: number; width: number; maxHeight: number };

function normalizeOption(opt: Option): NormalizedOption {
  if (typeof opt === 'string') return { value: opt, label: opt };
  return { value: opt.value, label: opt.label ?? opt.value };
}

type IMSContext = {
  value: string[];
  normalized: NormalizedOption[];
  selectedSet: Set<string>;
  query: string;
  setQuery: (s: string) => void;
  open: boolean;
  setOpen: (b: boolean) => void;
  fieldRef: React.MutableRefObject<HTMLDivElement | null>;
  overlayRef: React.MutableRefObject<HTMLDivElement | null>;
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  coords: Coords | null;
  filtered: NormalizedOption[];
  toggle: (val: string) => void;
  remove: (val: string) => void;
  clear: () => void;
};

const InputMultiSelectContext = React.createContext<IMSContext | null>(null);

function useInputMultiSelect(): IMSContext {
  const ctx = React.useContext(InputMultiSelectContext);
  if (!ctx) throw new Error('useInputMultiSelect must be used within <InputMultiSelect>');
  return ctx;
}

export type InputMultiSelectRootProps = {
  options: Option[];
  value: string[];
  onChange: (next: string[]) => void;
  children?: React.ReactNode;
};

function InputMultiSelectRoot({ options, value, onChange, children }: InputMultiSelectRootProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const fieldRef = React.useRef<HTMLDivElement | null>(null);
  const overlayRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');

  const selectedSet = React.useMemo(() => new Set(value), [value]);
  const normalized = React.useMemo(() => options.map(normalizeOption), [options]);
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return normalized;
    return normalized.filter(
      opt => opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q)
    );
  }, [normalized, query]);

  React.useEffect(() => {
    function handleDoc(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (containerRef.current?.contains(target)) return;
      if (overlayRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handleDoc);
    return () => document.removeEventListener('mousedown', handleDoc);
  }, []);

  const [coords, setCoords] = React.useState<Coords | null>(null);

  // Prefer placing the overlay below the field; flip above if there's more space upward.
  const measure = React.useCallback(() => {
    const anchor = fieldRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const gutter = 8;
    const bottomSpace = window.innerHeight - rect.bottom;
    const topSpace = rect.top;
    const preferBelow = bottomSpace >= topSpace;
    const available = preferBelow ? bottomSpace : topSpace;
    const maxHeight = Math.max(120, Math.min(300, available - gutter));
    const top = preferBelow ? rect.bottom : Math.max(0, rect.top - maxHeight);
    setCoords({ left: rect.left, top, width: rect.width, maxHeight });
  }, []);

  React.useLayoutEffect(() => {
    if (open) measure();
  }, [open, measure, query, value]);

  React.useEffect(() => {
    if (!open) return;
    const handler = () => measure();
    window.addEventListener('resize', handler);
    // Capture phase catches scrolls in nested scrollable ancestors.
    window.addEventListener('scroll', handler, true);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
    };
  }, [open, measure]);

  const remove = React.useCallback(
    (val: string) => onChange(value.filter(v => v !== val)),
    [value, onChange]
  );

  const toggle = React.useCallback(
    (val: string) => {
      const next = selectedSet.has(val) ? value.filter(v => v !== val) : [...value, val];
      onChange(next);
      setQuery('');
    },
    [selectedSet, value, onChange]
  );

  const clear = React.useCallback(() => onChange([]), [onChange]);

  const ctx: IMSContext = {
    value,
    normalized,
    selectedSet,
    query,
    setQuery,
    open,
    setOpen,
    fieldRef,
    overlayRef,
    inputRef,
    coords,
    filtered,
    toggle,
    remove,
    clear,
  };

  return (
    <InputMultiSelectContext.Provider value={ctx}>
      {/* shouldFilter={false} so we own filtering and can sort selected items to the top. */}
      <CommandPrimitive
        className="h-auto overflow-visible bg-transparent"
        shouldFilter={false}
      >
        <div
          ref={containerRef}
          className="relative"
        >
          {children}
        </div>
      </CommandPrimitive>
    </InputMultiSelectContext.Provider>
  );
}

function Field({ children }: { children?: React.ReactNode }) {
  const { fieldRef, inputRef } = useInputMultiSelect();
  return (
    <div
      ref={fieldRef}
      className="border-input text-foreground bg-background hover:bg-primary/10 focus-within:ring-ring flex h-7 w-full items-center gap-1 rounded border px-2 py-1 text-base shadow-sm transition-colors focus-within:outline-none focus-within:ring-1"
      role="group"
      onClick={() => inputRef.current?.focus()}
    >
      {children}
    </div>
  );
}
Field.displayName = 'InputMultiSelect.Field';

function Summary() {
  const { value, normalized, clear } = useInputMultiSelect();
  if (value.length === 0) return null;

  const firstLabel = normalized.find(o => o.value === value[0])?.label ?? value[0];
  const text = value.length > 1 ? String(value.length) : firstLabel;

  return (
    <Badge
      variant="default"
      className="inline-flex h-5 items-center gap-1 shrink-0 px-2"
    >
      <span
        className="truncate max-w-[160px]"
        title={firstLabel}
      >
        {text}
      </span>
      <span
        role="button"
        tabIndex={0}
        aria-label="Clear all selections"
        className="cursor-pointer select-none opacity-80 hover:opacity-100"
        onClick={() => clear()}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            clear();
          }
        }}
      >
        ×
      </span>
    </Badge>
  );
}
Summary.displayName = 'InputMultiSelect.Summary';

type IMSInputProps = {
  ariaLabel?: string;
  placeholder?: string;
};

function IMSInput({ ariaLabel, placeholder }: IMSInputProps) {
  const { inputRef, value, query, setQuery, open, setOpen, remove } = useInputMultiSelect();
  return (
    <CommandPrimitive.Input
      ref={node => {
        inputRef.current = node;
      }}
      aria-label={ariaLabel}
      placeholder={value.length === 0 ? placeholder : ''}
      className="h-5 min-w-0 flex-1 bg-transparent px-0 py-0 outline-none"
      value={query}
      onValueChange={v => {
        setQuery(v);
        if (!open) setOpen(true);
      }}
      onFocus={() => setOpen(true)}
      onKeyDown={e => {
        if (e.key === 'Escape') setOpen(false);
        // Backspace on empty query removes the most recently selected value.
        if (e.key === 'Backspace' && query === '' && value.length > 0) {
          remove(value[value.length - 1]);
        }
      }}
    />
  );
}
IMSInput.displayName = 'InputMultiSelect.Input';

type ContentProps = {
  children?: React.ReactNode;
  fitToContent?: boolean;
  maxWidth?: number;
};

function Content({ children, fitToContent = false, maxWidth }: ContentProps) {
  const { open, coords, overlayRef, setOpen } = useInputMultiSelect();
  if (!(open && coords)) return null;
  const gutter = 8;
  const viewportMaxWidth = Math.max(200, window.innerWidth - coords.left - gutter);
  const computedMaxWidth = Math.min(maxWidth ?? 480, viewportMaxWidth);
  return createPortal(
    <div
      ref={overlayRef}
      className="z-[1000] mt-1 rounded-md border border-input bg-popover shadow-md"
      style={{
        position: 'fixed',
        left: coords.left,
        top: coords.top,
        width: fitToContent ? 'auto' : coords.width,
        minWidth: coords.width,
        maxWidth: fitToContent ? computedMaxWidth : undefined,
        maxHeight: coords.maxHeight,
        overflow: 'hidden',
      }}
      onKeyDown={e => {
        if (e.key === 'Escape') setOpen(false);
      }}
    >
      <ScrollArea
        className="h-auto min-h-0 max-h-[inherit]"
        type="auto"
      >
        <CommandList
          className="max-h-none overflow-visible"
          role="listbox"
          aria-multiselectable={true}
        >
          {children}
        </CommandList>
      </ScrollArea>
    </div>,
    document.body
  );
}
Content.displayName = 'InputMultiSelect.Content';

function Options() {
  const { filtered, toggle, selectedSet } = useInputMultiSelect();
  // Selected items appear at the top so the user can quickly see and uncheck them.
  const selected = filtered.filter(o => selectedSet.has(o.value));
  const unselected = filtered.filter(o => !selectedSet.has(o.value));
  const ordered = [...selected, ...unselected];
  return (
    <CommandGroup>
      {filtered.length === 0 ? (
        <CommandEmpty>No options found.</CommandEmpty>
      ) : (
        ordered.map(opt => (
          <CommandItem
            key={opt.value}
            onSelect={() => toggle(opt.value)}
            aria-selected={selectedSet.has(opt.value)}
            className="min-w-0 leading-none"
          >
            <span
              className="truncate leading-none"
              title={opt.label}
            >
              {opt.label}
            </span>
            <Icons.Checked
              className={cn(
                'ml-auto block h-6 w-6 shrink-0',
                selectedSet.has(opt.value) ? 'opacity-70' : 'invisible'
              )}
              aria-hidden="true"
            />
          </CommandItem>
        ))
      )}
    </CommandGroup>
  );
}
Options.displayName = 'InputMultiSelect.Options';

const InputMultiSelect = Object.assign(InputMultiSelectRoot, {
  Field,
  Summary,
  Input: IMSInput,
  Content,
  Options,
});

export { InputMultiSelect };
export type { Option };
