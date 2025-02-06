import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../Dialog/Dialog';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../Select/Select';
import { Switch } from '../Switch/Switch';
import { cn } from '../../lib/utils';

interface ImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Main ImageDialog container. By default, we do not force any
 * layout here. We'll use a "Body" subcomponent for the main area
 * that sets up a flex row with a 70/30 split.
 */
function ImageDialog({ open, onOpenChange, children, className }: ImageDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className={cn('max-w-3xl', className)}>{children}</DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Title subcomponent: same pattern as your other dialogs. */

interface ImageTitleProps {
  children: React.ReactNode;
  className?: string;
}
function ImageTitle({ children, className }: ImageTitleProps) {
  return (
    <DialogHeader>
      <DialogTitle className={cn(className)}>{children}</DialogTitle>
    </DialogHeader>
  );
}

/* -------------------------------------------------------------------------- */
/* Body subcomponent: sets up a flex row (or column on small screens). */

interface ImageBodyProps {
  children: React.ReactNode;
  className?: string;
}
/**
 * By default, "flex flex-col sm:flex-row" so that on smaller screens
 * the image and controls stack, and on sm+ screens they go side by side.
 */
function ImageBody({ children, className }: ImageBodyProps) {
  return <div className={cn('flex flex-col sm:flex-row', className)}>{children}</div>;
}

/* -------------------------------------------------------------------------- */
/* ImageVisual subcomponent: default 70% at sm+ */

interface ImageVisualProps {
  src: string;
  alt?: string;
  className?: string;
}
function ImageVisual({ src, alt = '', className }: ImageVisualProps) {
  return (
    <div
      className={cn(
        'flex-1 items-center justify-center bg-black/80 p-4 sm:flex-[6]',
        'flex', // ensure the container is a flex box
        className
      )}
    >
      <img
        src={src}
        alt={alt}
        className="h-auto max-w-full rounded"
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ImageOptions subcomponent: default 30% at sm+ */

interface ImageOptionsProps {
  children: React.ReactNode;
  className?: string;
}
function ImageOptions({ children, className }: ImageOptionsProps) {
  return <div className={cn('flex-1 space-y-4 p-4 sm:flex-[4]', className)}>{children}</div>;
}

/* -------------------------------------------------------------------------- */
/* Filename subcomponent */

interface FilenameProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}
function Filename({ className, ...props }: FilenameProps) {
  return (
    <Input
      {...props}
      className={cn('w-full', className)}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Filetype subcomponent: uses Select */

interface FiletypeProps {
  selected: string;
  onSelect: (val: string) => void;
  className?: string;
}
function Filetype({ selected, onSelect, className }: FiletypeProps) {
  return (
    <Select
      value={selected}
      onValueChange={onSelect}
    >
      <SelectTrigger
        aria-label="File type"
        className={cn('w-[5.5rem] sm:w-24', className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="JPG">JPG</SelectItem>
        <SelectItem value="PNG">PNG</SelectItem>
      </SelectContent>
    </Select>
  );
}

/* -------------------------------------------------------------------------- */
/* ImageSize subcomponent */

interface ImageSizeProps {
  label?: string;
  width: string;
  height: string;
  onWidthChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onHeightChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}
function ImageSize({
  label = 'Image size px',
  width,
  height,
  onWidthChange,
  onHeightChange,
  className,
}: ImageSizeProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <label className="block text-sm font-semibold">{label}</label>
      <div className="flex items-center space-x-2">
        <Input
          value={width}
          onChange={onWidthChange}
          placeholder="Width"
          className="w-20"
        />
        <Input
          value={height}
          onChange={onHeightChange}
          placeholder="Height"
          className="w-20"
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SwitchOption subcomponent */

interface SwitchOptionProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}
function SwitchOption({ label, checked, onCheckedChange, className }: SwitchOptionProps) {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Actions subcomponent */

interface ActionsProps {
  onCancel: () => void;
  onSave: () => void;
  cancelText?: string;
  saveText?: string;
  className?: string;
}
function Actions({
  onCancel,
  onSave,
  cancelText = 'Cancel',
  saveText = 'Save',
  className,
}: ActionsProps) {
  return (
    <div className={cn('flex justify-end space-x-2 pt-2', className)}>
      <Button
        variant="secondary"
        onClick={onCancel}
      >
        {cancelText}
      </Button>
      <Button
        variant="default"
        onClick={onSave}
      >
        {saveText}
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Attach subcomponents onto the main ImageDialog function. */

ImageDialog.ImageTitle = ImageTitle;
ImageDialog.Body = ImageBody;
ImageDialog.ImageVisual = ImageVisual;
ImageDialog.ImageOptions = ImageOptions;
ImageDialog.Filename = Filename;
ImageDialog.Filetype = Filetype;
ImageDialog.ImageSize = ImageSize;
ImageDialog.SwitchOption = SwitchOption;
ImageDialog.Actions = Actions;

export { ImageDialog };
