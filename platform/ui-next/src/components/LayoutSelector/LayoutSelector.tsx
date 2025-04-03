import React, { createContext, useContext, useState, useCallback } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '../Popover/Popover';
import { Tooltip, TooltipTrigger, TooltipContent } from '../Tooltip';
import { Button } from '../Button';
import { cn } from '../../lib/utils';
import { Icons } from '../Icons';
import * as PropTypes from 'prop-types';

// Types
type LayoutCommandOptions = {
  numRows?: number;
  numCols?: number;
  protocolId?: string;
  [key: string]: any;
};

type LayoutPresetType = {
  title?: string;
  icon: string;
  commandOptions: LayoutCommandOptions;
  disabled?: boolean;
};

// Context
type LayoutSelectorContextType = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSelection: (commandOptions: LayoutCommandOptions) => void;
  onSelectionPreset: (commandOptions: LayoutCommandOptions) => void;
};

const LayoutSelectorContext = createContext<LayoutSelectorContextType | undefined>(undefined);

const useLayoutSelector = () => {
  const context = useContext(LayoutSelectorContext);
  if (context === undefined) {
    throw new Error('useLayoutSelector must be used within a LayoutSelector component');
  }
  return context;
};

// Main component
type LayoutSelectorProps = {
  onSelectionChange?: (commandOptions: LayoutCommandOptions, isPreset: boolean) => void;
  onSelection?: (commandOptions: LayoutCommandOptions) => void;
  onSelectionPreset?: (commandOptions: LayoutCommandOptions) => void;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  tooltipDisabled?: boolean; // Keep this prop for now as it might be used elsewhere
};

const LayoutSelector = ({
  onSelectionChange,
  onSelection = commandOptions => {},
  onSelectionPreset = commandOptions => {},
  children,
  open,
  onOpenChange,
  tooltipDisabled,
}: LayoutSelectorProps) => {
  const [isOpenInternal, setIsOpenInternal] = useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : isOpenInternal;
  const setIsOpen = isControlled ? onOpenChange! : setIsOpenInternal;

  const handleSelection = useCallback(
    (commandOptions: LayoutCommandOptions) => {
      onSelection(commandOptions);
      if (onSelectionChange) {
        onSelectionChange(commandOptions, false);
      }
      setIsOpen(false);
    },
    [onSelection, onSelectionChange, setIsOpen]
  );

  const handlePresetSelection = useCallback(
    (commandOptions: LayoutCommandOptions) => {
      onSelectionPreset(commandOptions);
      if (onSelectionChange) {
        onSelectionChange(commandOptions, true);
      }
      setIsOpen(false);
    },
    [onSelectionPreset, onSelectionChange, setIsOpen]
  );

  return (
    <LayoutSelectorContext.Provider
      value={{
        isOpen,
        setIsOpen,
        onSelection: handleSelection,
        onSelectionPreset: handlePresetSelection,
      }}
    >
      <Popover
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        {children}
      </Popover>
    </LayoutSelectorContext.Provider>
  );
};

// Sub-components
type TriggerProps = {
  children?: React.ReactNode;
  className?: string;
  tooltip?: string;
  disabled?: boolean;
  disabledText?: string;
};

const Trigger = ({
  children,
  className,
  tooltip = 'Change layout',
  disabled = false,
  disabledText,
}: TriggerProps) => {
  const { isOpen } = useLayoutSelector();

  const hasTooltip = tooltip || (disabled && disabledText);

  const button = (
    <Button
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center !rounded-lg',
        disabled
          ? 'text-common-bright hover:bg-primary-dark hover:text-primary-light cursor-not-allowed opacity-40'
          : isOpen
            ? 'bg-background text-foreground/80'
            : 'text-foreground/80 hover:bg-background hover:text-highlight bg-transparent',
        className
      )}
      variant="ghost"
      size="icon"
      aria-label={tooltip}
      disabled={disabled}
    >
      <Icons.ByName
        name="tool-layout"
        className="h-7 w-7"
      />
    </Button>
  );

  // If user passed children (custom button), just wrap it directly
  if (children) {
    return (
      <PopoverTrigger
        asChild
        className={className}
      >
        {children}
      </PopoverTrigger>
    );
  }

  if (!isOpen && hasTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <span data-cy="layout-button">{button}</span>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {tooltip && <div>{tooltip}</div>}
          {disabled && disabledText && <div className="text-muted-foreground">{disabledText}</div>}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <PopoverTrigger asChild>
      <span data-cy="layout-button">{button}</span>
    </PopoverTrigger>
  );
};

type ContentProps = {
  children: React.ReactNode;
  className?: string;
  align?: 'center' | 'start' | 'end';
  sideOffset?: number;
};

const Content = ({ children, className, align = 'center', sideOffset = 8 }: ContentProps) => {
  return (
    <PopoverContent
      align={align}
      sideOffset={sideOffset}
      className={cn('w-auto rounded-lg border-none p-0 shadow-lg', className)}
    >
      <div className="flex">{children}</div>
    </PopoverContent>
  );
};

type PresetSectionProps = {
  children: React.ReactNode;
  title: string;
  className?: string;
};

const PresetSection = ({ children, title, className }: PresetSectionProps) => {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="text-muted-foreground text-xs">{title}</div>
      {React.Children.count(children) > 0 && (
        <div
          className={cn(title.toLowerCase() === 'common' ? 'flex gap-2' : 'flex flex-col gap-0')}
        >
          {children}
        </div>
      )}
    </div>
  );
};

type PresetProps = LayoutPresetType & {
  className?: string;
  isPreset?: boolean;
  iconSize?: string; // Add new prop for icon size
};

const Preset = ({
  title,
  icon,
  commandOptions,
  disabled = false,
  className,
  isPreset = false,
  iconSize, // New prop
}: PresetProps) => {
  const { onSelection, onSelectionPreset } = useLayoutSelector();

  const handleClick = () => {
    if (disabled) {
      return;
    }

    if (isPreset) {
      onSelectionPreset(commandOptions);
    } else {
      onSelection(commandOptions);
    }
  };

  return (
    <div
      className={cn(
        'group cursor-pointer rounded transition',
        'hover:bg-accent flex items-center gap-2 p-1.5',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      onClick={handleClick}
      data-cy={title}
    >
      <div className="flex-shrink-0">
        <Icons.ByName
          name={icon}
          className={cn('group-hover:text-primary', iconSize)}
        />
      </div>
      {title && <div className="text-foreground text-base">{title}</div>}
    </div>
  );
};

type GridSelectorProps = {
  rows?: number;
  columns?: number;
  className?: string;
};

const GridSelector = ({ rows = 3, columns = 4, className }: GridSelectorProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(undefined);
  const { onSelection } = useLayoutSelector();

  const hoverX = hoveredIndex !== undefined ? hoveredIndex % columns : -1;
  const hoverY = hoveredIndex !== undefined ? Math.floor(hoveredIndex / columns) : -1;

  const isHovered = (index: number) => {
    if (hoveredIndex === undefined) {
      return false;
    }
    const x = index % columns;
    const y = Math.floor(index / columns);

    return x <= hoverX && y <= hoverY;
  };

  const handleSelection = (index: number) => {
    const x = index % columns;
    const y = Math.floor(index / columns);
    onSelection({
      numRows: y + 1,
      numCols: x + 1,
    });
  };

  return (
    <div
      className={cn(className)}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 20px)`,
        gridTemplateRows: `repeat(${rows}, 20px)`,
        gap: '2px',
      }}
    >
      {Array.from(Array(rows * columns).keys()).map(index => (
        <div
          key={index}
          className={cn('cursor-pointer', isHovered(index) ? 'bg-primary-active' : 'bg-[#04225b]')}
          data-cy={`Layout-${index % columns}-${Math.floor(index / columns)}`}
          onClick={() => handleSelection(index)}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(undefined)}
        />
      ))}
    </div>
  );
};

const Divider = ({ className }: { className?: string }) => (
  <div className={cn('h-px bg-black', className)}></div>
);

const HelpText = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <p className={cn('text-muted-foreground text-xs leading-tight', className)}>{children}</p>
);

// Assemble the compound component
LayoutSelector.Trigger = Trigger;
LayoutSelector.Content = Content;
LayoutSelector.PresetSection = PresetSection;
LayoutSelector.Preset = Preset;
LayoutSelector.GridSelector = GridSelector;
LayoutSelector.Divider = Divider;
LayoutSelector.HelpText = HelpText;

// PropTypes
LayoutSelector.propTypes = {
  onSelectionChange: PropTypes.func,
  onSelection: PropTypes.func,
  onSelectionPreset: PropTypes.func,
  children: PropTypes.node.isRequired,
  open: PropTypes.bool,
  onOpenChange: PropTypes.func,
  tooltipDisabled: PropTypes.bool,
};

export { LayoutSelector };
export default LayoutSelector;
