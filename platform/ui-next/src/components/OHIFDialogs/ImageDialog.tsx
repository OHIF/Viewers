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
      <DialogContent className={cn('max-w-3xl p-4', className)}>{children}</DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Title subcomponent */

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
/* Body subcomponent */

interface ImageBodyProps {
  children: React.ReactNode;
  className?: string;
}
function ImageBody({ children, className }: ImageBodyProps) {
  return <div className={cn('flex flex-col sm:flex-row', className)}>{children}</div>;
}

/* -------------------------------------------------------------------------- */
/* ImageVisual subcomponent */

interface ImageVisualProps {
  src: string;
  alt?: string;
  className?: string;
}
function ImageVisual({ src, alt = '', className }: ImageVisualProps) {
  return (
    <div
      className={cn(
        'flex-1 items-center justify-center rounded-2xl bg-black/80 p-4 sm:flex-[7]',
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
/* ImageOptions subcomponent */

interface ImageOptionsProps {
  children: React.ReactNode;
  className?: string;
}
function ImageOptions({ children, className }: ImageOptionsProps) {
  return <div className={cn('flex-1 space-y-5 p-4 sm:flex-[3]', className)}>{children}</div>;
}

/* -------------------------------------------------------------------------- */
/* Filename subcomponent */

interface FilenameProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'children'> {
  children: React.ReactNode;
  className?: string;
  /** Handler is optional. If not provided, default to a no‐op. */
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

function Filename({ children, className, value, onChange, ...props }: FilenameProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <label className="block text-base">{children}</label>
      <Input
        {...props}
        className={cn('w-full', className)}
        value={value}
        onChange={onChange ?? (() => {})}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Filetype subcomponent */

interface FiletypeProps {
  selected: string;
  /** Handler is optional. If not provided, we do nothing. */
  onSelect?: (val: string) => void;
  className?: string;
}

function Filetype({ selected, onSelect, className }: FiletypeProps) {
  return (
    <Select
      value={selected}
      onValueChange={val => onSelect?.(val)}
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
  children: React.ReactNode;
  width: string;
  height: string;
  /** Handlers optional. If not provided, default no‐op. */
  onWidthChange?: React.ChangeEventHandler<HTMLInputElement>;
  onHeightChange?: React.ChangeEventHandler<HTMLInputElement>;
  className?: string;
}

function ImageSize({
  children,
  width,
  height,
  onWidthChange,
  onHeightChange,
  className,
}: ImageSizeProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <label className="block text-base">{children}</label>

      {/* Flex container for width/height inputs */}
      <div className="flex items-center space-x-4">
        {/* Width group */}
        <div className="flex items-center space-x-2">
          <span className="text-foreground text-base">W</span>
          <Input
            value={width}
            onChange={onWidthChange ?? (() => {})}
            placeholder="Width"
            className="w-20"
          />
        </div>

        {/* Height group */}
        <div className="text-foreground flex items-center space-x-2 text-base">
          <span className="text-foreground text-base">H</span>
          <Input
            value={height}
            onChange={onHeightChange ?? (() => {})}
            placeholder="Height"
            className="w-20"
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SwitchOption subcomponent */

interface SwitchOptionProps {
  children: React.ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

function SwitchOption({
  children,
  checked,
  defaultChecked,
  onCheckedChange,
  className,
}: SwitchOptionProps) {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Switch
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={val => onCheckedChange?.(val)}
      />
      <span className="text-base">{children}</span>
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
    <div className={cn('mt-5 flex justify-start space-x-2 pt-2', className)}>
      <Button
        variant="secondary"
        className="min-w-[80px]"
        onClick={onCancel}
      >
        {cancelText}
      </Button>
      <Button
        variant="default"
        className="min-w-[80px]"
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
