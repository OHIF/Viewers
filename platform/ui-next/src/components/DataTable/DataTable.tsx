import * as React from 'react';
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

import { DataTableContext, useDataTable } from './context';
import { DataTableToolbar } from './Toolbar';
import { DataTableTitle } from './Title';
import { DataTablePagination } from './Pagination';
import { DataTableViewOptions as InternalViewOptions } from './ViewOptions';
import { DataTableFilterRow } from './FilterRow';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../Table';
import { ScrollArea } from '../ScrollArea';
import { cn } from '../../lib/utils';

export type DataTableProps<TData> = {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  getRowId?: (row: TData, index: number) => string;
  initialSorting?: SortingState;
  initialVisibility?: VisibilityState;
  initialFilters?: ColumnFiltersState;
  enforceSingleSelection?: boolean;
  onSelectionChange?: (rows: TData[]) => void;
  children: React.ReactNode;
};

/**
 * Root DataTable provider component.
 * Creates the TanStack table instance, manages state, and exposes it via context.
 */
function DataTableRoot<TData>({
  data,
  columns,
  getRowId,
  initialSorting = [],
  initialVisibility = {},
  initialFilters = [],
  enforceSingleSelection = true,
  onSelectionChange,
  children,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialVisibility);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>(initialFilters);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, rowSelection, columnFilters, pagination },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
    enableMultiRowSelection: !enforceSingleSelection,
    getRowId,
  });

  // When filters, sorting, or incoming data change, go back to the first page.
  React.useEffect(() => {
    setPagination(p => ({ ...p, pageIndex: 0 }));
  }, [columnFilters, sorting, data]);

  // Surface selection changes to consumers.
  React.useEffect(() => {
    if (!onSelectionChange) return;
    const selected = table.getSelectedRowModel().rows.map(r => r.original as TData);
    onSelectionChange(selected);
  }, [rowSelection, onSelectionChange, table]);

  const value = React.useMemo(
    () => ({
      table,
      sorting,
      setSorting,
      columnVisibility,
      setColumnVisibility,
      rowSelection,
      setRowSelection,
      columnFilters,
      setColumnFilters,
      pagination,
      setPagination,
      resetFilters: () => setColumnFilters([]),
    }),
    [table, sorting, columnVisibility, rowSelection, columnFilters, pagination]
  );

  return (
    <DataTableContext.Provider value={value}>
      {children}
    </DataTableContext.Provider>
  );
}

/**
 * Simple toolbar wrapper. Typically used as:
 * <DataTable.Toolbar>
 *   <DataTable.Title>...</DataTable.Title>
 *   <DataTable.Pagination />
 *   <DataTable.ViewOptions />
 * </DataTable.Toolbar>
 */
function Toolbar({ children }: { children?: React.ReactNode }) {
  return <DataTableToolbar>{children}</DataTableToolbar>;
}

/**
 * Title element rendered inside the toolbar.
 */
function Title({ children }: { children?: React.ReactNode }) {
  return <DataTableTitle>{children}</DataTableTitle>;
}

/**
 * Pagination controls bound to the current table instance.
 */
function Pagination() {
  return <DataTablePagination />;
}

type ViewOptionsProps<TData> = {
  getLabel?: (columnId: string) => string;
  canHide?: (columnId: string) => boolean;
  buttonText?: string;
};

/**
 * View options (column visibility) menu.
 */
function ViewOptions<TData>({
  getLabel,
  canHide,
  buttonText,
}: ViewOptionsProps<TData>) {
  return (
    <InternalViewOptions<TData>
      getLabel={getLabel}
      canHide={canHide}
      buttonText={buttonText}
    />
  );
}

type DataTableTableProps = {
  children?: React.ReactNode;
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
function DataTableTable({ children, className, tableClassName }: DataTableTableProps) {
  const { table } = useDataTable<any>();

  const renderColGroup = React.useCallback(
    () => (
      <colgroup>
        {table.getVisibleLeafColumns().map(col => {
          const meta =
            (col.columnDef.meta as { minWidth?: number | string } | undefined) ?? undefined;
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

  let headerChild: React.ReactElement | null = null;
  let filterRowChild: React.ReactElement | null = null;
  let bodyChild: React.ReactElement | null = null;

  React.Children.forEach(children, child => {
    if (!React.isValidElement(child)) return;
    if (child.type === DataTableHeader) headerChild = child;
    if (child.type === DataTableFilterRowCompound) filterRowChild = child;
    if (child.type === DataTableBody) bodyChild = child;
  });

  return (
    <div className={cn('border-input/50 min-h-0 flex-1 rounded-md border', className)}>
      <div className="flex h-full flex-col">
        {/* Header + filter row */}
        <div className="shrink-0 border-b border-input/50">
          <Table
            className={cn('table-fixed', tableClassName)}
            containerClassName="overflow-x-hidden"
            noScroll
          >
            {renderColGroup()}
            {headerChild}
            <TableBody>
              {filterRowChild}
            </TableBody>
          </Table>
        </div>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1">
          <ScrollArea className="h-full">
            <Table
              className={cn('table-fixed', tableClassName)}
              containerClassName="h-full"
              noScroll
            >
              {renderColGroup()}
              <TableBody>{bodyChild}</TableBody>
            </Table>
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
function DataTableHeader() {
  const { table } = useDataTable<any>();

  return (
    <TableHeader>
      {table.getHeaderGroups().map(headerGroup => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map(header => {
            const meta =
              (header.column.columnDef.meta as { headerClassName?: string } | undefined) ??
              undefined;
            const headerClassName = meta?.headerClassName ?? '';
            const sorted = header.column.getIsSorted() as false | 'asc' | 'desc';

            return (
              <TableHead
                key={header.id}
                className={cn('bg-muted', headerClassName)}
                aria-sort={
                  sorted === 'asc'
                    ? 'ascending'
                    : sorted === 'desc'
                      ? 'descending'
                      : 'none'
                }
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            );
          })}
        </TableRow>
      ))}
    </TableHeader>
  );
}

type FilterRowProps<TData> = {
  excludeColumnIds?: string[];
  resetCellId?: string;
  onReset?: () => void;
  renderCell?: (opts: {
    columnId: string;
    value: unknown;
    setValue: (v: unknown) => void;
  }) => React.ReactNode;
  inputClassName?: string;
};

/**
 * Wraps the lower-level DataTableFilterRow to automatically wire reset behavior
 * to the table's resetFilters helper when onReset is not provided.
 */
function DataTableFilterRowCompound<TData>({
  onReset,
  ...rest
}: FilterRowProps<TData>) {
  const { resetFilters } = useDataTable<TData>();

  return (
    <DataTableFilterRow<TData>
      onReset={onReset ?? resetFilters}
      {...rest}
    />
  );
}

type BodyProps<TData> = {
  /**
   * Which row model to render:
   * - "pagination" (default): uses table.getPaginationRowModel()
   * - "core": uses table.getRowModel()
   */
  rowModel?: 'pagination' | 'core';
  /**
   * Optional custom row renderer. If omitted, a default cell-only renderer is used.
   */
  renderRow?: (row: Row<TData>) => React.ReactNode;
  /**
   * Message shown when there are no rows to render.
   */
  emptyMessage?: string;
};

/**
 * Core body renderer. Keeps awareness of selection state via data-state="selected".
 * Consumers can either rely on the default row renderer or provide a custom one.
 */
function DataTableBody<TData>({
  rowModel = 'pagination',
  renderRow,
  emptyMessage = 'No results.',
}: BodyProps<TData>) {
  const { table } = useDataTable<TData>();
  const rows =
    rowModel === 'pagination'
      ? table.getPaginationRowModel().rows
      : table.getRowModel().rows;

  if (!rows.length) {
    return (
      <TableRow>
        <TableCell
          colSpan={table.getAllLeafColumns().length}
          className="h-24 text-center"
        >
          {emptyMessage}
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {rows.map(row =>
        renderRow ? (
          renderRow(row)
        ) : (
          <TableRow
            key={row.id}
            data-state={row.getIsSelected() ? 'selected' : undefined}
          >
            {row.getVisibleCells().map(cell => {
              const metaClass =
                ((cell.column.columnDef.meta as { cellClassName?: string })?.cellClassName) ??
                '';
              return (
                <TableCell key={cell.id} className={metaClass}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              );
            })}
          </TableRow>
        )
      )}
    </>
  );
}

const DataTableCompound = Object.assign(DataTableRoot, {
  Toolbar,
  Title,
  Pagination,
  ViewOptions,
  Table: DataTableTable,
  Header: DataTableHeader,
  FilterRow: DataTableFilterRowCompound,
  Body: DataTableBody,
});

export { DataTableCompound as DataTable };
