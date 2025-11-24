import * as React from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../../lib/utils';
import { Command as CommandPrimitive } from 'cmdk';
import { CommandList, CommandGroup, CommandItem, CommandEmpty } from '../Command/Command';
import { Badge } from '../Badge';
import { Icons } from '../Icons';
import { ScrollArea } from '../ScrollArea';

type Option = string | { value: string; label?: string };

function normalizeOption(opt: Option): { value: string; label: string } {
  if (typeof opt === 'string') return { value: opt, label: opt };
  return { value: opt.value, label: opt.label ?? opt.value };
}

type IMSContext = {
  // state
  value: string[];
  onChange: (next: string[]) => void;
  options: Option[];
  normalized: { value: string; label: string }[];
  selectedSet: Set<string>;
  disabled?: boolean;
  closeOnSelect: boolean;
  debounceMs: number;

  // inline query/open
  query: string;
  setQuery: (s: string) => void;
  open: boolean;
  setOpen: (b: boolean) => void;

  // layout/anchors
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  fieldRef: React.MutableRefObject<HTMLDivElement | null>;
  overlayRef: React.MutableRefObject<HTMLDivElement | null>;
  inputRef: React.MutableRefObject<HTMLInputElement | null>;

  // positioning
  coords: { left: number; top: number; width: number; maxHeight: number } | null;
  measure: () => void;

  // helpers
  filtered: { value: string; label: string }[];
  commit: (next: string[]) => void;
  toggle: (val: string) => void;
  remove: (val: string) => void;
  clear: () => void;
};

const InputMultiSelectContext = React.createContext<IMSContext | null>(null);
const useInputMultiSelect = () => {
  const ctx = React.useContext(InputMultiSelectContext);
  if (!ctx) throw new Error('useInputMultiSelect must be used within <InputMultiSelect>');
  return ctx;
};

export type InputMultiSelectRootProps = {
  options: Option[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  closeOnSelect?: boolean;
  debounceMs?: number;
  className?: string;
  children?: React.ReactNode;
};

const InputMultiSelectRoot = ({
  options,
  value,
  onChange,
  disabled,
  closeOnSelect = false,
  debounceMs = 0,
  className,
  children,
}: InputMultiSelectRootProps) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const fieldRef = React.useRef<HTMLDivElement | null>(null);
  const overlayRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [pending, setPending] = React.useState<string[] | null>(null);

  const selectedSet = React.useMemo(() => new Set((value ?? []).map(v => String(v))), [value]);
  const normalized = React.useMemo(() => options.map(normalizeOption), [options]);
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return normalized;
    return normalized.filter(opt =>
      opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q)
    );
  }, [normalized, query]);

  // Outside click
  React.useEffect(() => {
    function handleDoc(event: MouseEvent) {
      const target = event.target as Node | null;
      const fieldEl = containerRef.current;
      const dropEl = overlayRef.current;
      if (!target) return;
      if (fieldEl?.contains(target)) return;
      if (dropEl?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handleDoc);
    return () => document.removeEventListener('mousedown', handleDoc);
  }, []);

  // Positioning (fixed)
  const [coords, setCoords] = React.useState<{ left: number; top: number; width: number; maxHeight: number } | null>(null);
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
    window.addEventListener('scroll', handler, true);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
    };
  }, [open, measure]);

  // Debounce changes
  React.useEffect(() => {
    if (!pending) return;
    const id = setTimeout(() => {
      onChange(pending);
      setPending(null);
    }, Math.max(0, debounceMs));
    return () => clearTimeout(id);
  }, [pending, debounceMs, onChange]);

  const commit = React.useCallback((next: string[]) => {
    if (!debounceMs) return onChange(next);
    setPending(next);
  }, [debounceMs, onChange]);

  const remove = React.useCallback((val: string) => {
    const next = (value ?? []).filter(v => v !== val);
    commit(next);
  }, [value, commit]);

  const toggle = React.useCallback((val: string) => {
    const exists = selectedSet.has(val);
    const next = exists ? (value ?? []).filter(v => v !== val) : [...(value ?? []), val];
    commit(next);
    setQuery('');
    if (closeOnSelect) {
      setOpen(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [selectedSet, value, commit, closeOnSelect]);

  const clear = React.useCallback(() => commit([]), [commit]);

  const ctx: IMSContext = {
    value,
    onChange,
    options,
    normalized,
    selectedSet,
    disabled,
    closeOnSelect,
    debounceMs,
    query,
    setQuery,
    open,
    setOpen,
    containerRef,
    fieldRef,
    overlayRef,
    inputRef,
    coords,
    measure,
    filtered,
    commit,
    toggle,
    remove,
    clear,
  };

  return (
    <InputMultiSelectContext.Provider value={ctx}>
      {/* Single Command root to unify input and list for keyboard navigation */}
      <CommandPrimitive
        className={cn('h-auto overflow-visible bg-transparent', className)}
        // We control filtering via our own `filtered` state.
        shouldFilter={false}
      >
        <div ref={containerRef} className={cn('relative')}>{children}</div>
      </CommandPrimitive>
    </InputMultiSelectContext.Provider>
  );
};

type FieldProps = React.HTMLAttributes<HTMLDivElement> & { disabled?: boolean };
const Field = React.forwardRef<HTMLDivElement, FieldProps>(({ className, disabled: disabledProp, ...rest }, ref) => {
  const { fieldRef, inputRef, disabled } = useInputMultiSelect();
  return (
    <div
      ref={(node) => {
        fieldRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className={cn(
        'border-input text-foreground bg-background hover:bg-primary/10 focus-within:ring-ring flex h-7 w-full items-center gap-1 rounded border px-2 py-1 text-base shadow-sm transition-colors focus-within:outline-none focus-within:ring-1',
        (disabledProp ?? disabled) ? 'opacity-50 pointer-events-none' : '',
        className
      )}
      role="group"
      onClick={() => inputRef.current?.focus()}
      {...rest}
    />
  );
});
Field.displayName = 'InputMultiSelect.Field';

type SummaryProps = React.HTMLAttributes<HTMLDivElement> & {
  // Variant controls how selections are summarized:
  //  - 'single' (default): one badge; when multiple selected, shows the count (e.g., "3").
  //  - 'multi': each selected item renders as its own badge with remove affordance.
  variant?: 'single' | 'multi';
  // For 'single' variant, allow custom formatting (first label + extra count)
  format?: (firstLabel: string, extra: number) => string;
};
const Summary = ({ className, format, variant = 'multi', ...rest }: SummaryProps) => {
  const { value, normalized, clear, remove } = useInputMultiSelect();
  if (!value || value.length === 0) return null;

  if (variant === 'multi') {
    return (
      <div className={cn('flex flex-wrap items-center gap-1', className)} {...rest}>
        {value.map((val) => {
          const lab = normalized.find(o => o.value === val)?.label ?? val;
          return (
            <Badge key={val} variant="default" className="inline-flex h-5 items-center gap-1 shrink-0 px-2">
              <span className="truncate max-w-[160px]" title={lab}>{lab}</span>
              <span
                role="button"
                tabIndex={0}
                aria-label={`Remove ${lab}`}
                className="cursor-pointer select-none opacity-80 hover:opacity-100"
                onClick={() => remove(val)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); remove(val); } }}
              >
                ×
              </span>
            </Badge>
          );
        })}
      </div>
    );
  }

  // 'single' variant
  const firstVal = value[0];
  const firstLabel = normalized.find(o => o.value === firstVal)?.label ?? firstVal;
  const count = value.length;
  const text = format ? format(firstLabel, Math.max(0, count - 1)) : (count > 1 ? String(count) : firstLabel);
  return (
    <Badge variant="default" className={cn('inline-flex h-5 items-center gap-1 shrink-0 px-2', className)} {...rest}>
      <span className="truncate max-w-[160px]" title={firstLabel}>{text}</span>
      <span
        role="button"
        tabIndex={0}
        aria-label="Clear all selections"
        className="cursor-pointer select-none opacity-80 hover:opacity-100"
        onClick={() => clear()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); clear(); } }}
      >
        ×
      </span>
    </Badge>
  );
};
Summary.displayName = 'InputMultiSelect.Summary';

type InputPropsEx = Omit<React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>, 'value'> & { ariaLabel?: string };
const IMSInput = React.forwardRef<HTMLInputElement, InputPropsEx>(({ className, placeholder, ariaLabel, onFocus, onKeyDown, onBlur, onValueChange, ...rest }, ref) => {
  const { inputRef, value, query, setQuery, open, setOpen, remove } = useInputMultiSelect();
  return (
    <CommandPrimitive.Input
      ref={(node) => {
        inputRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      }}
      aria-label={ariaLabel}
      placeholder={value.length === 0 ? placeholder : ''}
      className={cn('h-5 min-w-0 flex-1 bg-transparent px-0 py-0 outline-none', className)}
      value={query}
      onValueChange={(v) => {
        setQuery(v);
        if (!open) setOpen(true);
        onValueChange?.(v);
      }}
      onFocus={(e) => {
        setOpen(true);
        onFocus?.(e);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false);
        if (e.key === 'Backspace' && query === '' && value.length > 0) {
          remove(value[value.length - 1]);
        }
        // Arrow key handling is provided by cmdk when input and list share the same Command root.
        onKeyDown?.(e);
      }}
      onBlur={(e) => {
        onBlur?.(e);
      }}
      {...rest}
    />
  );
});
IMSInput.displayName = 'InputMultiSelect.Input';

type ContentProps = React.HTMLAttributes<HTMLDivElement> & {
  children?: React.ReactNode;
  fitToContent?: boolean;
  maxWidth?: number; // only used when fitToContent is true
};
const Content = ({ className, children, fitToContent = false, maxWidth, ...rest }: ContentProps) => {
  const { open, disabled, coords, overlayRef, setOpen } = useInputMultiSelect();
  if (!(open && !disabled && coords)) return null;
  const gutter = 8;
  const viewportMaxWidth = Math.max(200, (typeof window !== 'undefined' ? window.innerWidth : 1200) - coords.left - gutter);
  const computedMaxWidth = Math.min(maxWidth ?? 480, viewportMaxWidth);
  return createPortal(
    <div
      ref={overlayRef}
      className={cn('z-[1000] mt-1 rounded-md border border-input bg-popover shadow-md', className)}
      style={{
        position: 'fixed',
        left: coords.left,
        top: coords.top,
        width: fitToContent ? 'auto' as any : coords.width,
        minWidth: coords.width,
        maxWidth: fitToContent ? computedMaxWidth : undefined,
        maxHeight: coords.maxHeight,
        overflow: 'hidden',
      }}
      onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
      {...rest}
    >
      <ScrollArea className="h-auto min-h-0 max-h-[inherit]" type="auto">
        <CommandList className="max-h-none overflow-visible" role="listbox" aria-multiselectable={true}>
          {children}
        </CommandList>
      </ScrollArea>
    </div>,
    document.body
  );
};
Content.displayName = 'InputMultiSelect.Content';

type ListProps = React.ComponentPropsWithoutRef<typeof CommandList> & { multiselectable?: boolean };
const List = React.forwardRef<React.ElementRef<typeof CommandList>, ListProps>(({ className, multiselectable = true, children, ...props }, ref) => {
  return (
    <CommandList
      ref={ref}
      className={className}
      role="listbox"
      aria-multiselectable={multiselectable}
      {...props}
    >
      {children}
    </CommandList>
  );
});
List.displayName = 'InputMultiSelect.List';

const Group = CommandGroup as unknown as typeof CommandGroup;
Group.displayName = 'InputMultiSelect.Group';

type ItemProps = React.ComponentPropsWithoutRef<typeof CommandItem> & { valueKey?: string };
const Item = React.forwardRef<React.ElementRef<typeof CommandItem>, ItemProps>(({ children, value: itemValue, valueKey, className, ...props }, ref) => {
  const { toggle, selectedSet } = useInputMultiSelect();
  const label = typeof itemValue === 'string' ? itemValue : String(itemValue ?? '');
  const val = (valueKey ?? label) as string;
  const selected = selectedSet.has(val);
  return (
    <CommandItem
      ref={ref}
      onSelect={() => toggle(val)}
      aria-selected={selected}
      className={cn('min-w-0 leading-none', className)}
      {...props}
    >
      {children ?? (
        <span className="truncate leading-none" title={label}>{label}</span>
      )}
      <Icons.Checked
        className={cn('ml-auto block h-6 w-6 shrink-0', selected ? 'opacity-70' : 'invisible')}
        aria-hidden="true"
      />
    </CommandItem>
  );
});
Item.displayName = 'InputMultiSelect.Item';

const Empty = CommandEmpty as unknown as typeof CommandEmpty;
Empty.displayName = 'InputMultiSelect.Empty';

// Convenience: render items for current filtered options
// Selected items appear at the top, order otherwise preserved.
const Options = () => {
  const { filtered, toggle, selectedSet } = useInputMultiSelect();
  const selected = filtered.filter(o => selectedSet.has(o.value));
  const unselected = filtered.filter(o => !selectedSet.has(o.value));
  const ordered = [...selected, ...unselected];
  return (
    <Group>
      {filtered.length === 0 ? (
        <Empty>No options found.</Empty>
      ) : (
        ordered.map(opt => (
          <CommandItem key={opt.value} onSelect={() => toggle(opt.value)} aria-selected={selectedSet.has(opt.value)} className="min-w-0 leading-none">
            <span className="truncate leading-none" title={opt.label}>{opt.label}</span>
            <Icons.Checked
              className={cn('ml-auto block h-6 w-6 shrink-0', selectedSet.has(opt.value) ? 'opacity-70' : 'invisible')}
              aria-hidden="true"
            />
          </CommandItem>
        ))
      )}
    </Group>
  );
};
Options.displayName = 'InputMultiSelect.Options';

// Root export with subcomponents
const InputMultiSelect = Object.assign(InputMultiSelectRoot, {
  Field,
  Summary,
  Input: IMSInput,
  Content,
  List,
  Group,
  Item,
  Empty,
  Options,
});

export { InputMultiSelect };
export type { Option };
