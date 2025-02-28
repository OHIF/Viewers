import * as React from 'react';
import { Input } from '../Input';
import { ScrollArea } from '../ScrollArea';
import { cn } from '../../lib/utils';

interface PresetDialogProps {
  children: React.ReactNode;
  className?: string;
}

export function PresetDialog({ children, className }: PresetDialogProps) {
  return <div className={cn('flex h-[500px] max-w-lg flex-col', className)}>{children}</div>;
}

/**
 * Subcomponent: PresetBody
 * A dark "box" container that wraps the filter and grid area.
 * Adjust bg color, padding, border, etc. to match your design.
 */
interface PresetBodyProps {
  children: React.ReactNode;
  className?: string;
}
function PresetBody({ children, className }: PresetBodyProps) {
  return (
    <div
      className={cn(
        // Adjust these classes for your desired look
        'flex min-h-0 flex-1 flex-col rounded-md border border-white/10 bg-black p-2',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Subcomponent: PresetFilter
 */
interface PresetFilterProps {
  children: React.ReactNode;
  className?: string;
}
function PresetFilter({ children, className }: PresetFilterProps) {
  return (
    <div className={cn('mb-2 flex w-full flex-shrink-0 items-center space-x-2', className)}>
      {children}
    </div>
  );
}

/**
 * Subcomponent: PresetSearch
 */
interface PresetSearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}
function PresetSearch({ className, ...props }: PresetSearchProps) {
  return (
    <Input
      className={cn('w-full', className)}
      {...props}
    />
  );
}

/**
 * Subcomponent: PresetGrid
 */
interface PresetGridProps {
  children: React.ReactNode;
  maxHeight?: string;
  className?: string;
}
function PresetGrid({ children, maxHeight = 'flex-1', className }: PresetGridProps) {
  return (
    <ScrollArea className={cn('min-h-0 flex-1', className)}>
      <div className="grid grid-cols-4 gap-2 pr-2">{children}</div>
    </ScrollArea>
  );
}

/**
 * Subcomponent: PresetOption
 */
interface PresetOptionProps {
  label?: string;
  className?: string;
}
function PresetOption({ label = 'Label', className }: PresetOptionProps) {
  return (
    <div className={cn('flex flex-col items-start space-y-1', className)}>
      {/* Default dark placeholder box (swap in an <img> if you like) */}
      <div className="bg-popover h-16 w-24 rounded" />
      <div className="text-muted-foreground text-left text-base">{label}</div>
    </div>
  );
}

/* Attach subcomponents to PresetDialog as static properties */
PresetDialog.PresetBody = PresetBody;
PresetDialog.PresetFilter = PresetFilter;
PresetDialog.PresetSearch = PresetSearch;
PresetDialog.PresetGrid = PresetGrid;
PresetDialog.PresetOption = PresetOption;
