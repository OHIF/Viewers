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
}
function Title({ children }: TitleProps) {
  return (
    <DialogHeader>
      <DialogTitle>{children}</DialogTitle>
    </DialogHeader>
  );
}

/** Body */
interface BodyProps {
  children: React.ReactNode;
}
function Body({ children }: BodyProps) {
  return <div className="flex flex-col space-y-4">{children}</div>;
}

/** Responsive 3-column grid for hotkeys, down to 2 on smaller screens, and 1 on extra small */
interface HotkeysGridProps {
  children: React.ReactNode;
}
function HotkeysGrid({ children }: HotkeysGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 gap-x-16 md:grid-cols-2 lg:grid-cols-3">{children}</div>
  );
}

/** A single hotkey row: label + input */
interface HotkeyProps {
  label: string;
  placeholder?: string;
}
function Hotkey({ label, placeholder }: HotkeyProps) {
  return (
    <div className="flex items-center justify-between space-x-2">
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
}
function Footer({ onRestoreDefaults, onCancel, onSave }: FooterProps) {
  return (
    <DialogFooter className="sticky bottom-0 bg-muted">
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