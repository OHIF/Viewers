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
import type {
  ColumnDef,
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
  VisibilityState,
  PaginationState,
  Row,
} from '@tanstack/react-table';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
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

// Type for state update functions that accept either a value or an updater function
type Updater<T> = T | ((prev: T) => T);
type OnChangeFn<T> = (updater: Updater<T>) => void;

export type DataTableProps<TData> = {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  getRowId?: (row: TData, index: number) => string;
  initialVisibility?: VisibilityState;
  sorting?: SortingState;
  pagination?: PaginationState;
  filters?: ColumnFiltersState;
  onSortingChange?: OnChangeFn<SortingState>;
  onPaginationChange?: OnChangeFn<PaginationState>;
  onFiltersChange?: OnChangeFn<ColumnFiltersState>;
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
  enforceSingleSelection = true,
  onSelectionChange,
  children,
}: DataTableProps<TData>) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(initialVisibility);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable<TData>({
    data,
    columns,
    state: { sorting, columnVisibility, rowSelection, columnFilters: filters, pagination },
    onSortingChange: onSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: onFiltersChange,
    onPaginationChange: onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
    enableMultiRowSelection: !enforceSingleSelection,
    getRowId,
    autoResetPageIndex: false,
  });

  // After rendering non-empty data once, any updates to the data will
  // reset the pagination to the first page. This takes care of returning to
  // the first page when sorting or filtering changes for now. Might need to
  // revisit this later.
  const nonEmptyDataRenderedRef = useRef(!!data?.length);
  useEffect(() => {
    if (!nonEmptyDataRenderedRef.current) {
      nonEmptyDataRenderedRef.current = !!data?.length;
      return;
    }

    onPaginationChange(pagination => ({ ...pagination, pageIndex: 0 }));
  }, [data, onPaginationChange]);

  // Surface selection changes to consumers.
  useEffect(() => {
    if (!onSelectionChange) {
      return;
    }
    const selected = table.getSelectedRowModel().rows.map(r => r.original as TData);
    onSelectionChange(selected);
  }, [rowSelection, onSelectionChange, table]);

  return (
    <DataTableContext.Provider value={{ table } as DataTableContextValue<unknown>}>
      {children}
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

  let headerChild: ReactElement | null = null;
  let filterRowChild: ReactElement | null = null;
  let bodyChild: ReactElement | null = null;

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
    <div className={cn('border-input/50 min-h-0 flex-1 rounded-md border', className)}>
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
          <ScrollArea className="h-full">
            <BasicTable
              className={cn('table-fixed', tableClassName)}
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
 * Applies meta.headerClassName and a muted background to match StudyList styling.
 */
function Header<TData>() {
  const { table } = useDataTable<TData>();

  return (
    <BasicTableHeader>
      {table.getHeaderGroups().map(headerGroup => (
        <BasicTableRow key={headerGroup.id}>
          {headerGroup.headers.map(header => {
            const meta = (header.column.columnDef.meta as ColumnMeta | undefined) ?? undefined;
            const headerClassName = meta?.headerClassName ?? '';
            const sortState = header.column.getIsSorted() as false | 'asc' | 'desc';

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
  render?: (row: Row<TData>) => ReactNode;
  onClick?: (row: Row<TData>) => void;
  onDoubleClick?: (row: Row<TData>) => void;
  className?: string | ((row: Row<TData>) => string);
};

type BodyProps<TData> = {
  rowProps?: RowProps<TData>;
  /**
   * Message shown when there are no rows to render.
   */
  emptyMessage?: string;
};

/**
 * Core body renderer. Keeps awareness of selection state via data-state="selected".
 * Automatically uses pagination if getPaginationRowModel is configured on the table.
 * Consumers can either rely on the default row renderer or provide a custom one.
 */
function Body<TData>({ rowProps, emptyMessage = 'No results.' }: BodyProps<TData>) {
  const { table } = useDataTable<TData>();

  // Automatically determine if pagination should be used
  // Use pagination if getPaginationRowModel is defined (pagination is configured)
  const rows =
    typeof table.getPaginationRowModel === 'function'
      ? table.getPaginationRowModel().rows
      : table.getRowModel().rows;

  if (!rows.length) {
    return (
      <BasicTableRow>
        <BasicTableCell
          colSpan={table.getAllLeafColumns().length}
          className="h-24 text-center"
        >
          {emptyMessage}
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

        // Default row rendering
        return (
          <BasicTableRow
            key={row.id}
            data-state={row.getIsSelected() ? 'selected' : undefined}
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
            aria-selected={row.getIsSelected()}
          >
            {row.getVisibleCells().map(cell => {
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
