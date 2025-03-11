import React, { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '../Popover/Popover';
import { cn } from '../../lib/utils';
import { Icons } from '../../';
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
        'hover:bg-primary-dark/30 flex cursor-pointer flex-col items-center justify-center rounded p-2 transition',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      onClick={() => {
        !disabled && onSelection(commandOptions);
      }}
      data-cy={title}
    >
      <Icons.ByName
        name={icon}
        className="group-hover:text-primary-light"
      />
      {title && <div className="mt-1 text-sm text-white">{title}</div>}
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
      className={cn('bg-primary-dark rounded p-2', className)}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 20px)`,
        gridTemplateRows: `repeat(${rows}, 20px)`,
      }}
    >
      {Array.from(Array(rows * columns).keys()).map(index => (
        <div
          key={index}
          className={cn(
            'border-primary-dark cursor-pointer border',
            isHovered(index) ? 'bg-primary-active' : 'bg-[#04225b]'
          )}
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
            className="hover:bg-primary-dark/30 flex items-center justify-center rounded px-3 py-2 text-white transition"
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
        className="border-primary-dark rounded border bg-black p-4"
      >
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="mb-2 font-medium text-white">Grid Layout</h3>
            <GridLayoutSelector
              onSelection={handleSelection}
              rows={rows}
              columns={columns}
            />
          </div>

          {commonPresets.length > 0 && (
            <div>
              <h3 className="mb-2 font-medium text-white">Common Layouts</h3>
              <div className="grid grid-cols-4 gap-2">
                {commonPresets.map((preset, index) => (
                  <LayoutPreset
                    key={`common-preset-${index}`}
                    onSelection={handleSelection}
                    title={preset.name}
                    icon={preset.icon || 'layout-grid'}
                    commandOptions={preset.commandOptions}
                    disabled={tooltipDisabled}
                  />
                ))}
              </div>
            </div>
          )}

          {advancedPresets.length > 0 && (
            <div>
              <h3 className="mb-2 font-medium text-white">Hanging Protocols</h3>
              <div className="grid grid-cols-4 gap-2">
                {advancedPresets.map((preset, index) => (
                  <LayoutPreset
                    key={`advanced-preset-${index}`}
                    onSelection={handlePresetSelection}
                    title={preset.name}
                    icon={preset.icon || 'layout-grid'}
                    commandOptions={preset.commandOptions}
                    disabled={tooltipDisabled}
                  />
                ))}
              </div>
            </div>
          )}
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
