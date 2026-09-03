import * as React from 'react';
import type { Cell } from '@tanstack/react-table';
import type { ColumnMeta } from './types';

// Context to share computed values with sub-components
type ActionOverlayCellContextValue = {
  isActive: boolean;
  computedAlign: 'start' | 'center' | 'end';
  cell: Cell<unknown, unknown>;
};

const ActionOverlayCellContext = React.createContext<ActionOverlayCellContextValue | null>(null);

// Symbol to identify sub-components
const VALUE_TYPE = Symbol('ActionOverlayCell.Value');
const OVERLAY_TYPE = Symbol('ActionOverlayCell.Overlay');

type ActionOverlayCellProps<TData> = {
  cell: Cell<TData, unknown>;
  children?: React.ReactNode;
};

export function ActionOverlayCell<TData>({ cell, children }: ActionOverlayCellProps<TData>) {
  const isActive = cell.row.getIsSelected();
  const meta = (cell.column.columnDef.meta as ColumnMeta | undefined) ?? undefined;
  const align = meta?.align ?? 'right';
  // Map 'left' | 'center' | 'right' to 'start' | 'center' | 'end' for overlay positioning
  const computedAlign = align === 'left' ? 'start' : align === 'center' ? 'center' : 'end';

  const contextValue: ActionOverlayCellContextValue = {
    isActive,
    computedAlign,
    cell: cell as Cell<unknown, unknown>,
  };

  // Extract Value and Overlay components from children
  // Only Value and Overlay sub-components are recognized; other children are ignored
  let valueElement: React.ReactElement | null = null;
  let overlayElement: React.ReactElement | null = null;

  React.Children.forEach(children, child => {
    if (React.isValidElement(child)) {
      const childType = (child.type as { _type?: symbol })?._type;
      if (childType === VALUE_TYPE) {
        valueElement = child;
      } else if (childType === OVERLAY_TYPE) {
        overlayElement = child;
      }
    }
  });

  return (
    <ActionOverlayCellContext.Provider value={contextValue}>
      <div className="relative">
        {valueElement}
        {overlayElement}
      </div>
    </ActionOverlayCellContext.Provider>
  );
}

// Value sub-component
type ValueProps = {
  children?: React.ReactNode;
};

function Value({ children }: ValueProps) {
  const context = React.useContext(ActionOverlayCellContext);
  if (!context) {
    throw new Error('ActionOverlayCell.Value must be used within ActionOverlayCell');
  }

  const { isActive, computedAlign } = context;
  const valueAlignmentClass =
    computedAlign === 'end' ? 'text-right' : computedAlign === 'center' ? 'text-center' : '';
  const valueVisibilityClass = isActive
    ? 'invisible opacity-0'
    : 'group-hover:invisible group-hover:opacity-0 group-hover:text-transparent';

  return (
    <div className={`transition-opacity ${valueAlignmentClass} ${valueVisibilityClass}`}>
      {children}
    </div>
  );
}

// Mark Value component with symbol for identification
(Value as { _type?: symbol })._type = VALUE_TYPE;

// Overlay sub-component
type OverlayProps = {
  children?: React.ReactNode;
};

function Overlay({ children }: OverlayProps) {
  const context = React.useContext(ActionOverlayCellContext);
  if (!context) {
    throw new Error('ActionOverlayCell.Overlay must be used within ActionOverlayCell');
  }

  const { isActive, computedAlign, cell } = context;
  const overlayPositionClass =
    computedAlign === 'center'
      ? 'inset-y-0 inset-x-0 justify-center px-2'
      : computedAlign === 'start'
        ? 'inset-y-0 left-0 px-2'
        : 'inset-y-0 right-0 px-2';
  const overlayVisibilityClass = isActive
    ? 'bg-popover opacity-100'
    : 'opacity-0 group-hover:bg-muted group-hover:opacity-100';

  return (
    <div
      className={`absolute z-10 flex items-center ${overlayPositionClass} ${overlayVisibilityClass}`}
      onMouseDown={e => {
        e.stopPropagation();
        if (!cell.row.getIsSelected()) {
          cell.row.toggleSelected(true);
        }
      }}
      onPointerDown={e => {
        e.stopPropagation();
        if (!cell.row.getIsSelected()) {
          cell.row.toggleSelected(true);
        }
      }}
    >
      {children}
    </div>
  );
}

// Mark Overlay component with symbol for identification
(Overlay as { _type?: symbol })._type = OVERLAY_TYPE;

// Export as compound component
ActionOverlayCell.Value = Value;
ActionOverlayCell.Overlay = Overlay;
