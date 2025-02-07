import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '../Dialog';
import { Button } from '../Button';
import { Input } from '../Input';
import { ScrollArea } from '../ScrollArea';
import { cn } from '../../lib/utils';

interface PresetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function PresetDialog({ open, onOpenChange, children, className }: PresetDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className={cn('max-w-lg p-4', className)}>{children}</DialogContent>
    </Dialog>
  );
}

/**
 * Subcomponent: PresetTitle
 */
interface PresetTitleProps {
  children: React.ReactNode;
  className?: string;
}
function PresetTitle({ children, className }: PresetTitleProps) {
  return (
    <DialogHeader>
      <DialogTitle className={cn('font-normal', className)}>{children}</DialogTitle>
    </DialogHeader>
  );
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
        'rounded-md border border-white/10 bg-black p-2',
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
  return <div className={cn('mb-2 flex w-full items-center space-x-2', className)}>{children}</div>;
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
function PresetGrid({ children, maxHeight = 'max-h-64 pr-3', className }: PresetGridProps) {
  return (
    <ScrollArea className={cn(maxHeight, className)}>
      <div className="grid grid-cols-4 gap-2">{children}</div>
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

/**
 * Subcomponent: PresetActions
 */
interface PresetActionsProps {
  onCancel?: () => void;
  onSave?: () => void;
  disableCancel?: boolean;
  disableSave?: boolean;
  className?: string;
}
function PresetActions({
  onCancel,
  onSave,
  disableCancel,
  disableSave,
  className,
}: PresetActionsProps) {
  return (
    <DialogFooter className={cn('flex justify-end space-x-2', className)}>
      {!disableCancel && (
        <Button
          variant="secondary"
          className="min-w-[80px]"
          onClick={onCancel}
        >
          Cancel
        </Button>
      )}
      {!disableSave && (
        <Button
          variant="default"
          className="min-w-[80px]"
          onClick={onSave}
        >
          Save
        </Button>
      )}
    </DialogFooter>
  );
}

/* Attach subcomponents to PresetDialog as static properties */
PresetDialog.PresetTitle = PresetTitle;
PresetDialog.PresetBody = PresetBody; // <-- NEW subcomponent
PresetDialog.PresetFilter = PresetFilter;
PresetDialog.PresetSearch = PresetSearch;
PresetDialog.PresetGrid = PresetGrid;
PresetDialog.PresetOption = PresetOption;
PresetDialog.PresetActions = PresetActions;
