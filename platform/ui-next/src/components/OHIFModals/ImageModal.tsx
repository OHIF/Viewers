import * as React from 'react';
import { Input } from '../Input/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../Select/Select';
import { Switch } from '../Switch/Switch';
import { cn } from '../../lib/utils';

interface ImageModalProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Main ImageModal container. By default, we do not force any
 * layout here. We'll use a "Body" subcomponent for the main area
 * that sets up a flex row with a 70/30 split.
 */
export function ImageModal({ children, className }: ImageModalProps) {
  return <div className={cn(className)}>{children}</div>;
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
  className?: string;
  children: React.ReactNode;
}
function ImageVisual({ children, className }: ImageVisualProps) {
  return (
    <div
      className={cn(
        'flex-1 items-center justify-center rounded-2xl bg-black/80 p-4 sm:flex-[7]',
        'flex', // ensure the container is a flex box
        className
      )}
    >
      <div className="h-[512px] w-[512px] overflow-auto">{children}</div>
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
    <div className={cn('text-foreground space-y-1', className)}>
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
  /** Array of file type options */
  options?: Array<{ value: string; label: string }>;
}

function Filetype({ selected, onSelect, className, options = [] }: FiletypeProps) {
  const defaultOptions = [
    { value: 'jpg', label: 'JPG' },
    { value: 'png', label: 'PNG' },
  ];

  const fileTypeOptions = options.length ? options : defaultOptions;

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
        {fileTypeOptions.map(option => (
          <SelectItem
            key={option.value}
            value={option.value}
          >
            {option.label}
          </SelectItem>
        ))}
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
  maxWidth?: string;
  maxHeight?: string;
}

function ImageSize({
  children,
  width,
  height,
  onWidthChange,
  onHeightChange,
  className,
  maxWidth,
  maxHeight,
}: ImageSizeProps) {
  return (
    <div className={cn('text-foreground space-y-1', className)}>
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
            max={maxWidth}
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
            max={maxHeight}
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
    <div className={cn('text-foreground flex items-center space-x-2', className)}>
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
/* Attach subcomponents onto the main ImageModal function. */

ImageModal.Body = ImageBody;
ImageModal.ImageVisual = ImageVisual;
ImageModal.ImageOptions = ImageOptions;
ImageModal.Filename = Filename;
ImageModal.Filetype = Filetype;
ImageModal.ImageSize = ImageSize;
ImageModal.SwitchOption = SwitchOption;
