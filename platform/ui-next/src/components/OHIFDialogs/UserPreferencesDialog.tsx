import * as React from 'react';
import { Button } from '../Button';
import { Label } from '../Label';
import { Input } from '../Input';
import { cn } from '../../lib/utils';

interface UserPreferencesDialogProps {
  children: React.ReactNode;
  className?: string;
}

export function UserPreferencesDialog({ children, className }: UserPreferencesDialogProps) {
  return <div className={cn(className)}>{children}</div>;
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
      <div className={cn('mt-4 mb-4 flex flex-col space-y-4', className)}>{children}</div>
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

/** Attach subcomponents as static properties for a nicer API */
UserPreferencesDialog.Body = Body;
UserPreferencesDialog.HotkeysGrid = HotkeysGrid;
UserPreferencesDialog.Hotkey = Hotkey;
UserPreferencesDialog.SubHeading = SubHeading;
