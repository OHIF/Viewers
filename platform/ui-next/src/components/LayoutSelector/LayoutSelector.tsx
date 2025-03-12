import React, { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '../Popover/Popover';
import { cn } from '../../lib/utils';
// Import the Icons component
// Note: Adjust this path based on your actual project structure
import { Icons } from '../Icons';
import * as PropTypes from 'prop-types';

type LayoutPresetProps = {
  onSelection: (commandOptions: any) => void;
  title?: string;
  icon: string;
  commandOptions: any;
  className?: string;
  disabled?: boolean;
};

const LayoutPreset: React.FC<LayoutPresetProps> = ({
  onSelection,
  title,
  icon,
  commandOptions,
  className,
  disabled = false,
}) => {
  return (
    <div
      className={cn(
        'group cursor-pointer rounded transition',
        'hover:bg-accent flex items-center gap-2 p-1.5',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      onClick={() => {
        !disabled && onSelection(commandOptions);
      }}
      data-cy={title}
    >
      <div className="flex-shrink-0">
        <Icons.ByName
          name={icon}
          className="group-hover:text-primary"
        />
      </div>
      {title && <div className="text-foreground text-base">{title}</div>}
    </div>
  );
};

type GridLayoutSelectorProps = {
  onSelection: (commandOptions: any) => void;
  rows?: number;
  columns?: number;
  className?: string;
};

const GridLayoutSelector: React.FC<GridLayoutSelectorProps> = ({
  onSelection,
  rows = 3,
  columns = 4,
  className,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(undefined);
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
          onClick={() => {
            const x = index % columns;
            const y = Math.floor(index / columns);
            onSelection({
              numRows: y + 1,
              numCols: x + 1,
            });
          }}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(undefined)}
        />
      ))}
    </div>
  );
};

type LayoutSelectorProps = {
  onSelection?: (commandOptions: any) => void;
  onSelectionPreset?: (commandOptions: any) => void;
  rows?: number;
  columns?: number;
  commonPresets?: Array<any>;
  advancedPresets?: Array<any>;
  tooltipDisabled?: boolean;
  servicesManager?: any;
  label?: string;
  disablePrev?: boolean;
  disableNext?: boolean;
  trigger?: React.ReactNode;
};

const LayoutSelector: React.FC<LayoutSelectorProps> = ({
  onSelection = () => {},
  onSelectionPreset = () => {},
  rows = 3,
  columns = 4,
  commonPresets = [],
  advancedPresets = [],
  tooltipDisabled = false,
  servicesManager = null,
  trigger,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasPresets = commonPresets.length > 0 || advancedPresets.length > 0;

  const handleSelection = (commandOptions: any) => {
    onSelection(commandOptions);
    setIsOpen(false);
  };

  const handlePresetSelection = (commandOptions: any) => {
    onSelectionPreset(commandOptions);
    setIsOpen(false);
  };

  return (
    <Popover
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <PopoverTrigger asChild>
        {trigger || (
          <button
            className="hover:bg-primary-dark/30 text-foreground flex items-center justify-center rounded px-3 py-2 transition"
            aria-label="Layout selector"
          >
            <Icons.ByName name="tool-layout" />
            <span className="ml-2">Layout</span>
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="center"
        sideOffset={8}
        className="w-auto rounded-lg border-none p-0 shadow-lg"
      >
        <div className="flex">
          {/* Left Side - Presets */}
          {hasPresets && (
            <div className="bg-popover flex flex-col gap-2.5 rounded-lg p-2">
              {commonPresets.length > 0 && (
                <>
                  <div className="text-muted-foreground text-xs">Common</div>
                  <div className="flex gap-2">
                    {commonPresets.map((preset, index) => (
                      <LayoutPreset
                        key={`common-preset-${index}`}
                        onSelection={handleSelection}
                        icon={preset.icon}
                        commandOptions={preset.commandOptions}
                      />
                    ))}
                  </div>
                  <div className="h-px bg-black"></div>
                </>
              )}

              {advancedPresets.length > 0 && (
                <>
                  <div className="text-muted-foreground text-xs">Advanced</div>
                  <div className="flex flex-col gap-0">
                    {advancedPresets.map((preset, index) => (
                      <LayoutPreset
                        key={`advanced-preset-${index}`}
                        onSelection={handlePresetSelection}
                        title={preset.title}
                        icon={preset.icon}
                        commandOptions={preset.commandOptions}
                        disabled={preset.disabled}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Right Side - Grid Layout */}
          <div className="bg-muted flex flex-col gap-2.5 border-l-2 border-solid border-black p-2">
            <div className="text-muted-foreground text-xs">Custom</div>
            <GridLayoutSelector
              onSelection={handleSelection}
              rows={rows}
              columns={columns}
            />
            <p className="text-muted-foreground text-xs leading-tight">
              Hover to select <br />
              rows and columns <br /> Click to apply
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

LayoutSelector.propTypes = {
  onSelection: PropTypes.func,
  onSelectionPreset: PropTypes.func,
  rows: PropTypes.number,
  columns: PropTypes.number,
  commonPresets: PropTypes.array,
  advancedPresets: PropTypes.array,
  tooltipDisabled: PropTypes.bool,
  servicesManager: PropTypes.object,
  trigger: PropTypes.node,
};

export { LayoutSelector, LayoutPreset, GridLayoutSelector };
export default LayoutSelector;
