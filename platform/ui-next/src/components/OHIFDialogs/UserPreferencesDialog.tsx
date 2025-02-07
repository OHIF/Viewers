import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '../Dialog';
import { Button } from '../Button';
import { Label } from '../Label';
import { Input } from '../Input';
import { cn } from '../../lib/utils';

interface UserPreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function UserPreferencesDialog({
  open,
  onOpenChange,
  children,
  className,
}: UserPreferencesDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className={cn('flex max-h-[80vh] max-w-3xl flex-col', className)}>
        {children}
      </DialogContent>
    </Dialog>
  );
}

/** Title */
interface TitleProps {
  children: React.ReactNode;
  className?: string;
}
function Title({ children, className }: TitleProps) {
  return (
    <DialogHeader>
      <DialogTitle className={cn(className)}>{children}</DialogTitle>
    </DialogHeader>
  );
}

/** Body
 *  Automatically wraps content in a scrollable area.
 */
interface BodyProps {
  children: React.ReactNode;
  className?: string;
}
function Body({ children, className }: BodyProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className={cn('mt-2 mb-4 flex flex-col space-y-4', className)}>{children}</div>
    </div>
  );
}

/** Subheading
 *  Section labels
 */
interface SubHeadingProps {
  children: React.ReactNode;
  className?: string;
}
function SubHeading({ children, className }: SubHeadingProps) {
  return <span className={cn('text-muted-foreground text-lg', className)}>{children}</span>;
}

/** Responsive 3-column grid for hotkeys, etc. */
interface HotkeysGridProps {
  children: React.ReactNode;
  className?: string;
}
function HotkeysGrid({ children, className }: HotkeysGridProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-3 gap-x-16 md:grid-cols-2 lg:grid-cols-3', className)}>
      {children}
    </div>
  );
}

/** A single hotkey row: label + input */
interface HotkeyProps {
  label: string;
  placeholder?: string;
  className?: string;
}
function Hotkey({ label, placeholder, className }: HotkeyProps) {
  return (
    <div className={cn('flex items-center justify-between space-x-2', className)}>
      <Label className="whitespace-nowrap">{label}</Label>
      <Input
        className="w-16 text-center"
        placeholder={placeholder}
      />
    </div>
  );
}

/** Footer with "Restore Defaults", "Cancel", "Save".
 *  Placed outside the scrollable region for consistent positioning.
 */
interface FooterProps {
  onRestoreDefaults?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
  className?: string;
}
function Footer({ onRestoreDefaults, onCancel, onSave, className }: FooterProps) {
  return (
    <div className="flex-shrink-0">
      <DialogFooter className={cn(className)}>
        <div className="flex w-full items-center justify-between">
          <Button
            variant="ghost"
            onClick={onRestoreDefaults}
          >
            Restore Defaults
          </Button>
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              onClick={onCancel}
              className="min-w-[80px]"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={onSave}
              className="min-w-[80px]"
            >
              Save
            </Button>
          </div>
        </div>
      </DialogFooter>
    </div>
  );
}

/** Attach subcomponents as static properties for a nicer API */
UserPreferencesDialog.Title = Title;
UserPreferencesDialog.Body = Body;
UserPreferencesDialog.HotkeysGrid = HotkeysGrid;
UserPreferencesDialog.Hotkey = Hotkey;
UserPreferencesDialog.Footer = Footer;
UserPreferencesDialog.SubHeading = SubHeading;
