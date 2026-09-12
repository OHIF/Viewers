// This file is compiled by the React Compiler — there is no opt-out here.
//
// The contract that keeps it correct: TanStack state must never be read
// through an identity-stable object (a row, cell, column, or header) in
// render. The compiler caches such reads keyed on the object, which never
// changes, so the value freezes at mount. Read the replaced-on-change state
// object instead — table.state.<slice> — and derive from it, or hand the
// value in through a Subscribe boundary (see ColumnHeader). Method reads
// keyed on the `table` wrapper itself are safe: useTable returns a fresh
// wrapper whenever options or subscribed state change. Reads of static
// column config (columnDef, meta) are safe frozen. Event handlers may call
// anything — they execute fresh at event time.

import React, {
  type ReactNode,
  type ReactElement,
  useState,
  useCallback,
  useEffect,
  useRef,
  Children,
  isValidElement,
} from 'react';
import { useTranslation } from 'react-i18next';
import type {
  ColumnDef,
  ColumnFiltersState,
  RowSelectionState,
  ReactTable,
  SortingState,
  ColumnVisibilityState,
  PaginationState,
  Row,
} from '@tanstack/react-table';
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  flexRender,
} from '@tanstack/react-table';
import { DataTableContext, DataTableContextValue, useDataTable } from './context';
import { Toolbar } from './Toolbar';
import { Title } from './Title';
import { Pagination } from './Pagination';
import { ViewOptions } from './ViewOptions';
import { ActionOverlayCell } from './ActionOverlayCell';
import { FilterRow } from './FilterRow';
import { ColumnHeader } from './ColumnHeader';
import { ResponsiveColumnsProvider, useResponsiveColumns } from './useResponsiveColumns';
import type { ColumnMeta } from './types';
import {
  Table as BasicTable,
  TableHeader as BasicTableHeader,
  TableBody as BasicTableBody,
  TableHead as BasicTableHead,
  TableRow as BasicTableRow,
  TableCell as BasicTableCell,
} from '../Table';
import { ScrollArea } from '../ScrollArea';
import { cn } from '../../lib/utils';

/**
 * The feature set for every OHIF DataTable.
 *
 * Defined at module scope deliberately: v9 requires `features` to be stable, and
 * a fresh object each render would invalidate every data-dependent model. The
 * core row model is automatic in v9 and must not be registered here.
 *
 * Client-side filtering is always registered; the `manualFiltering` prop
 * disables the filtering step at runtime, which is the supported way to support
 * both client- and server-side filtering from one static feature set.
 */
export const dataTableFeatures = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
});

export type DataTableFeatures = typeof dataTableFeatures;

/**
 * Drops selected row ids that are absent from the table’s currently visible row
 * model. Returns the given selection unchanged when every selected row is
 * visible, so callers can use reference identity to detect “nothing to do”.
 */
function pruneToVisibleRows<TData>(
  selection: RowSelectionState,
  table: ReactTable<DataTableFeatures, TData>
): RowSelectionState {
  const selectedIds = Object.keys(selection);
  if (selectedIds.length === 0) {
    return selection;
  }
  const rows = table.getPaginatedRowModel().rows;
  const visibleIds = new Set(rows.map(r => r.id));
  if (selectedIds.every(id => visibleIds.has(id))) {
    return selection;
  }
  const next: RowSelectionState = {};
  for (const id of selectedIds) {
    if (visibleIds.has(id)) {
      next[id] = selection[id];
    }
  }
  return next;
}

// Type for state update functions that accept either a value or an updater function
type Updater<T> = T | ((prev: T) => T);
type OnChangeFn<T> = (updater: Updater<T>) => void;

export type DataTableProps<TData> = {
  data: TData[];
  columns: ColumnDef<DataTableFeatures, TData, unknown>[];
  getRowId?: (row: TData, index: number) => string;
  initialVisibility?: ColumnVisibilityState;
  sorting?: SortingState;
  pagination?: PaginationState;
  filters?: ColumnFiltersState;
  onSortingChange?: OnChangeFn<SortingState>;
  onPaginationChange?: OnChangeFn<PaginationState>;
  onFiltersChange?: OnChangeFn<ColumnFiltersState>;
  manualFiltering?: boolean;
  enforceSingleSelection?: boolean;
  onSelectionChange?: (rows: TData[]) => void;
  children: ReactNode;
};

/**
 * Root DataTable provider component.
 * Creates the TanStack table instance, manages state, and exposes it via context.
 */
function DataTableRoot<TData>({
  data,
  columns,
  getRowId,
  initialVisibility = {},
  sorting = [],
  pagination = { pageIndex: 0, pageSize: 50 },
  filters = [],
  onSortingChange,
  onPaginationChange,
  onFiltersChange,
  manualFiltering = false,
  enforceSingleSelection = true,
  onSelectionChange,
  children,
}: DataTableProps<TData>) {
  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibilityState>(initialVisibility);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useTable<DataTableFeatures, TData>({
    features: dataTableFeatures,
    data,
    columns,
    state: { sorting, columnVisibility, rowSelection, columnFilters: filters, pagination },
    onSortingChange: onSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: onFiltersChange,
    onPaginationChange: onPaginationChange,
    manualFiltering,
    enableRowSelection: true,
    enableMultiRowSelection: !enforceSingleSelection,
    getRowId,
    autoResetPageIndex: false,
  });

  // Invariant: if a row id is in rowSelection, that row is on screen. Enforced
  // in this one place so every reader — this component, its subcomponents, and
  // onSelectionChange — gets the same answer with nothing to remember. Keeping
  // off-screen rows selected and filtering at each point of use instead would
  // leave two competing notions of what is selected, with the stored one as the
  // wrong default.
  //
  // Adjusted during render rather than from an effect: React discards this
  // render and re-runs it immediately with the corrected state, so there is no
  // second commit and the stale selection is never painted.
  //
  // Convergence is on us. react-hooks/set-state-in-render permits any guarded
  // set-state during render without checking that the guard settles, so what
  // stops the re-render here is pruneToVisibleRows being idempotent and
  // returning its argument unchanged when every selected row is already visible.
  const prunedSelection = pruneToVisibleRows(rowSelection, table);
  if (prunedSelection !== rowSelection) {
    setRowSelection(prunedSelection);
  }

  // Reset pagination to page 0 when filters or sorting change, but only when
  // pagination itself did not change in the same render. A simultaneous
  // pagination change means the caller set the page intentionally (e.g. a
  // coordinated state restore), so we leave it alone.
  // The refs are initialized to the mount-time values so the first effect run
  // always sees all three as unchanged — ensuring that
  // any pagination applied with filtering or sorting during the initial render
  // is not overridden.
  const prevFiltersRef = useRef(filters);
  const prevSortingRef = useRef(sorting);
  const prevPaginationRef = useRef(pagination);

  useEffect(() => {
    const filtersChanged = filters !== prevFiltersRef.current;
    const sortingChanged = sorting !== prevSortingRef.current;
    const paginationChanged = pagination !== prevPaginationRef.current;
    prevFiltersRef.current = filters;
    prevSortingRef.current = sorting;
    prevPaginationRef.current = pagination;

    if ((filtersChanged || sortingChanged) && !paginationChanged && onPaginationChange) {
      onPaginationChange(p => ({ ...p, pageIndex: 0 }));
    }
  }, [filters, sorting, pagination, onPaginationChange]);

  // Surface selection changes to consumers. Safe to read the selection whole:
  // it is pruned to the visible rows above, so it can never contain a row the
  // user cannot see.
  useEffect(() => {
    if (!onSelectionChange) {
      return;
    }
    onSelectionChange(table.getSelectedRowModel().rows.map(r => r.original as TData));
  }, [rowSelection, onSelectionChange, table]);

  return (
    <DataTableContext.Provider value={{ table } as DataTableContextValue<unknown>}>
      <ResponsiveColumnsProvider>{children}</ResponsiveColumnsProvider>
    </DataTableContext.Provider>
  );
}

type TableProps = {
  children?: ReactNode;
  /**
   * Optional className applied to the outer bordered container.
   */
  className?: string;
  /**
   * Optional className applied to the underlying <table> in both header and body tables.
   */
  tableClassName?: string;
};

/**
 * Layout shell that renders:
 * - A header table (column headers + optional filter row).
 * - A scrollable body table.
 *
 * Consumers pass <DataTable.Header />, <DataTable.FilterRow />, and <DataTable.Body />
 * as children; this component wires them into the correct structure.
 */
function Table<TData>({ children, className, tableClassName }: TableProps) {
  const { table } = useDataTable<TData>();
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Drive responsive column visibility from the wrapper's width. The hook
  // is a no-op for tables whose columns don't declare meta.priority, and
  // publishes the "unfit" set through ResponsiveColumnsProvider (rendered
  // by DataTableRoot above us in the tree).
  useResponsiveColumns(table, wrapperRef);

  const rows = table.getPaginatedRowModel().rows;
  const isEmpty = rows.length === 0;

  const renderColGroup = useCallback(
    () => (
      <colgroup>
        {table.getVisibleLeafColumns().map(col => {
          const meta = (col.columnDef.meta as ColumnMeta | undefined) ?? undefined;
          const minWidth = meta?.minWidth;
          return minWidth ? (
            <col
              key={col.id}
              style={{
                width: typeof minWidth === 'number' ? `${minWidth}px` : minWidth,
              }}
            />
          ) : (
            <col key={col.id} />
          );
        })}
      </colgroup>
    ),
    [table]
  );

  let headerChild: ReactElement<any> | null = null;
  let filterRowChild: ReactElement<any> | null = null;
  let bodyChild: ReactElement<any> | null = null;

  Children.forEach(children, child => {
    if (!isValidElement(child)) {
      return;
    }
    if (child.type === Header) {
      headerChild = child;
    }
    if (child.type === FilterRow) {
      filterRowChild = child;
    }
    if (child.type === Body) {
      bodyChild = child;
    }
  });

  return (
    <div
      ref={wrapperRef}
      className={cn('border-input/50 min-h-0 flex-1 rounded-md border', className)}
    >
      <div className="flex h-full flex-col">
        {/* Header + filter row */}
        <div className="border-input/50 shrink-0 border-b">
          <BasicTable
            className={cn('table-fixed', tableClassName)}
            containerClassName="overflow-x-hidden"
            noScroll
          >
            {renderColGroup()}
            {headerChild}
            <BasicTableBody>{filterRowChild}</BasicTableBody>
          </BasicTable>
        </div>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1">
          <ScrollArea className={cn('h-full', isEmpty && '[&>div>div]:!h-full')}>
            <BasicTable
              className={cn('h-full table-fixed', tableClassName)}
              containerClassName="h-full"
              noScroll
            >
              {renderColGroup()}
              <BasicTableBody>{bodyChild}</BasicTableBody>
            </BasicTable>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the table header row(s) based on the current table instance.
 * Applies meta.headerClassName and a muted background for visual separation from the body.
 */
function Header<TData>() {
  const { table } = useDataTable<TData>();
  // getHeaderGroups() is identity-stable across a sort change (header groups
  // do not derive from sorting), so the loop below would not re-run for one.
  // Reading the sorting state here — an object replaced on every change —
  // and deriving each column's direction from it makes sorting a dependency
  // of the loop.
  const sorting = table.state.sorting;

  return (
    <BasicTableHeader>
      {table.getHeaderGroups().map(headerGroup => (
        <BasicTableRow key={headerGroup.id}>
          {headerGroup.headers.map(header => {
            const meta = (header.column.columnDef.meta as ColumnMeta | undefined) ?? undefined;
            const headerClassName = meta?.headerClassName ?? '';
            const sortEntry = sorting.find(s => s.id === header.column.id);
            const sortState = sortEntry ? (sortEntry.desc ? 'desc' : 'asc') : false;

            return (
              <BasicTableHead
                key={header.id}
                className={cn('bg-muted', headerClassName)}
                aria-sort={
                  sortState === 'asc' ? 'ascending' : sortState === 'desc' ? 'descending' : 'none'
                }
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </BasicTableHead>
            );
          })}
        </BasicTableRow>
      ))}
    </BasicTableHeader>
  );
}

type RowProps<TData> = {
  render?: (row: Row<DataTableFeatures, TData>) => ReactNode;
  onClick?: (row: Row<DataTableFeatures, TData>) => void;
  onDoubleClick?: (row: Row<DataTableFeatures, TData>) => void;
  className?: string | ((row: Row<DataTableFeatures, TData>) => string);
};

type BodyProps<TData> = {
  rowProps?: RowProps<TData>;
  /**
   * Message shown when there are no rows to render.
   */
  emptyMessage?: string;
  /**
   * When true and there are no rows, show loadingComponent centered instead of emptyMessage.
   */
  isLoading?: boolean;
  /**
   * Rendered in the empty body when isLoading is true (e.g. customization loading indicator).
   */
  loadingComponent?: ReactNode;
};

/**
 * Core body renderer. Keeps awareness of selection state via data-state="selected".
 * Every DataTable is paginated: the paginated row model is registered statically
 * in dataTableFeatures and pagination state always has a default.
 * Consumers can either rely on the default row renderer or provide a custom one.
 */
function Body<TData>({ rowProps, emptyMessage, isLoading, loadingComponent }: BodyProps<TData>) {
  const { t } = useTranslation('DataTable');
  const resolvedEmptyMessage = emptyMessage ?? t('No results.');
  const { table } = useDataTable<TData>();

  // The row-model array is identity-stable across selection and visibility
  // changes (row models derive from data/filters/sorting/pagination only), so
  // the row loop below would not re-run for either. Reading both state
  // objects here — each replaced on every change — and deriving per-row
  // selection and per-row cells from them makes both dependencies of the loop.
  const rowSelection = table.state.rowSelection;
  const columnVisibility = table.state.columnVisibility;

  // Automatically determine if pagination should be used
  // Use pagination if getPaginatedRowModel is defined (pagination is configured)
  const rows = table.getPaginatedRowModel().rows;

  if (!rows.length) {
    if (isLoading && loadingComponent) {
      return (
        <BasicTableRow className="hover:bg-transparent hover:text-inherit hover:[&>td]:text-inherit hover:[&>th]:text-inherit">
          <BasicTableCell colSpan={table.getAllLeafColumns().length}>
            <div className="flex h-full w-full items-center justify-center">{loadingComponent}</div>
          </BasicTableCell>
        </BasicTableRow>
      );
    }
    return (
      <BasicTableRow className="hover:bg-transparent hover:text-inherit hover:[&>td]:text-inherit hover:[&>th]:text-inherit">
        <BasicTableCell
          colSpan={table.getAllLeafColumns().length}
          className="!pt-10 text-center align-text-top"
        >
          {resolvedEmptyMessage}
        </BasicTableCell>
      </BasicTableRow>
    );
  }

  return (
    <>
      {rows.map(row => {
        const customRender = rowProps?.render?.(row);

        if (customRender) {
          return customRender;
        }

        const isSelected = rowSelection[row.id] === true;
        // Default row rendering
        return (
          <BasicTableRow
            key={row.id}
            data-state={isSelected ? 'selected' : undefined}
            className={
              rowProps?.className
                ? typeof rowProps.className === 'function'
                  ? rowProps.className(row)
                  : rowProps.className
                : ''
            }
            {...(rowProps?.onClick && { onClick: () => rowProps.onClick(row) })}
            {...(rowProps?.onDoubleClick && {
              onDoubleClick: () => rowProps.onDoubleClick(row),
            })}
            aria-selected={isSelected}
          >
            {/* Cells are derived through the visibility map read above rather
                than row.getVisibleCells(), whose result is reachable only via
                the identity-stable row. Equivalent while this table has no
                column ordering/pinning/grouping features. */}
            {row
              .getAllCells()
              .filter(cell => columnVisibility[cell.column.id] !== false)
              .map(cell => {
                const metaClass =
                  (cell.column.columnDef.meta as ColumnMeta | undefined)?.cellClassName ?? '';
                return (
                  <BasicTableCell
                    key={cell.id}
                    className={metaClass}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </BasicTableCell>
                );
              })}
          </BasicTableRow>
        );
      })}
    </>
  );
}

const DataTable = Object.assign(DataTableRoot, {
  Toolbar,
  Title,
  Pagination,
  ViewOptions,
  Table,
  Header,
  FilterRow,
  Body,
  ColumnHeader,
  ActionOverlayCell,
});

export { DataTable };
