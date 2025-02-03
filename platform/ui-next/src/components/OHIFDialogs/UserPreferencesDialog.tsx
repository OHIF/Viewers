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
      {/* Everything goes in DialogContent so it appears in the modal */}
      <DialogContent className={cn('max-w-3xl', className)}>{children}</DialogContent>
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

/** Body */
interface BodyProps {
  children: React.ReactNode;
  className?: string;
}
function Body({ children, className }: BodyProps) {
  return <div className={cn("flex flex-col space-y-4", className)}>{children}</div>;
}

/** Responsive 3-column grid for hotkeys, down to 2 on smaller screens, and 1 on extra small */
interface HotkeysGridProps {
  children: React.ReactNode;
  className?: string;
}
function HotkeysGrid({ children, className }: HotkeysGridProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-3 gap-x-16 md:grid-cols-2 lg:grid-cols-3", className)}>
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
    <div className={cn("flex items-center justify-between space-x-2", className)}>
      {/* Force the label text to stay on one line or wrap, as desired */}
      <Label className="whitespace-nowrap">{label}</Label>
      {/* Keep the input from expanding too far */}
      <Input
        className="w-16 text-center"
        placeholder={placeholder}
      />
    </div>
  );
}

/** Footer with "Restore Defaults" (left), "Cancel"/"Save" (right) */
interface FooterProps {
  onRestoreDefaults?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
  className?: string;
}
function Footer({ onRestoreDefaults, onCancel, onSave, className }: FooterProps) {
  return (
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
  );
}

/** Attach all subcomponents */
UserPreferencesDialog.Title = Title;
UserPreferencesDialog.Body = Body;
UserPreferencesDialog.HotkeysGrid = HotkeysGrid;
UserPreferencesDialog.Hotkey = Hotkey;
UserPreferencesDialog.Footer = Footer;