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

function ImageDialog({ open, onOpenChange, children, className }: ImageDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      {/* Match UserPreferencesDialog by removing p-0 and using max-w-3xl */}
      <DialogContent className={cn('max-w-3xl', className)}>{children}</DialogContent>
    </Dialog>
  );
}

/* ---------------------------------------------------------------------------------- */
/* Title subcomponent: same pattern as UserPreferencesDialog.Title */

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

/* ---------------------------------------------------------------------------------- */
/* ImageVisual subcomponent: just a container + image */

interface ImageVisualProps {
  src: string;
  alt?: string;
  className?: string;
}
function ImageVisual({ src, alt, className }: ImageVisualProps) {
  return (
    <div className={cn('flex flex-1 items-center justify-center bg-black/80 p-4', className)}>
      <img
        src={src}
        alt={alt}
        className="h-auto max-w-full rounded"
      />
    </div>
  );
}

/* ---------------------------------------------------------------------------------- */
/* ImageOptions container */

interface ImageOptionsProps {
  children: React.ReactNode;
  className?: string;
}
function ImageOptions({ children, className }: ImageOptionsProps) {
  return <div className={cn('flex-1 space-y-4 p-4', className)}>{children}</div>;
}

/* ---------------------------------------------------------------------------------- */
/* Filename: simple Input */

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

/* ---------------------------------------------------------------------------------- */
/* Filetype: uses Select */

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

/* ---------------------------------------------------------------------------------- */
/* ImageSize: label + two Inputs */

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

/* ---------------------------------------------------------------------------------- */
/* SwitchOption: label + Switch */

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

/* ---------------------------------------------------------------------------------- */
/* Actions: Cancel + Save */

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

/* ---------------------------------------------------------------------------------- */
/* Compound pattern: attach everything to ImageDialog */

ImageDialog.ImageTitle = ImageTitle;
ImageDialog.ImageVisual = ImageVisual;
ImageDialog.ImageOptions = ImageOptions;
ImageDialog.Filename = Filename;
ImageDialog.Filetype = Filetype;
ImageDialog.ImageSize = ImageSize;
ImageDialog.SwitchOption = SwitchOption;
ImageDialog.Actions = Actions;

export { ImageDialog };
